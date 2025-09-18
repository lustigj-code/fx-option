"""Webhook handling for QuickBooks Online invoice events."""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import logging
from typing import Any, Dict, Iterable

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

from .config import Settings
from .exposures import ExposureEmitter, ExposureEvent
from .oauth import QBOOAuthClient
from .qbo_client import QBOClient

logger = logging.getLogger(__name__)

router = APIRouter()


def _verify_signature(raw_body: bytes, signature: str, token: str) -> bool:
    digest = hmac.new(token.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, signature)


def _iter_invoice_events(payload: Dict[str, Any]) -> Iterable[Dict[str, Any]]:
    for event in payload.get("eventNotifications", []):
        for entity in event.get("dataChangeEvent", {}).get("entities", []):
            if entity.get("name") == "Invoice" and entity.get("operation") in {"Create", "Update"}:
                yield entity


async def _process_invoice(
    client: QBOClient,
    emitter: ExposureEmitter,
    entity: Dict[str, Any],
) -> None:
    invoice_id = entity.get("id")
    if not invoice_id:
        logger.warning("Skipping invoice event without id: %s", entity)
        return

    try:
        invoice = await client.get_invoice(invoice_id)
    except KeyError:
        logger.info("Invoice %s no longer exists", invoice_id)
        return
    except Exception:  # pylint: disable=broad-except
        logger.exception("Failed to fetch invoice %s", invoice_id)
        return

    due_date = invoice.get("DueDate")
    currency = invoice.get("CurrencyRef", {}).get("value")
    company_currency = await client.get_company_currency()

    if not due_date or not currency:
        logger.debug("Invoice %s missing due date or currency", invoice_id)
        return

    if currency == company_currency:
        logger.debug("Invoice %s is in home currency %s", invoice_id, currency)
        return

    amount = float(invoice.get("TotalAmt", 0))
    counterparty = invoice.get("CustomerRef", {}).get("name", "Unknown")

    event = ExposureEvent(
        invoice_id=str(invoice_id),
        amount=amount,
        currency=currency,
        due_date=due_date,
        counterparty=counterparty,
        metadata={
            "doc_number": invoice.get("DocNumber"),
            "status": invoice.get("Balance") and ("Open" if invoice.get("Balance") else "Paid"),
            "link": invoice.get("Id"),
        },
    )
    await emitter.emit(event)


@router.post("/webhook")
async def handle_webhook(request: Request, background: BackgroundTasks) -> Dict[str, str]:
    settings = Settings.get()
    raw_body = await request.body()
    signature = request.headers.get("intuit-signature")
    if not signature or not _verify_signature(raw_body, signature, settings.webhook_verifier_token):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError as exc:  # pragma: no cover - FastAPI handles
        raise HTTPException(status_code=400, detail="Invalid JSON payload") from exc

    entities = list(_iter_invoice_events(payload))
    if not entities:
        return {"status": "ignored"}

    oauth = QBOOAuthClient(settings)
    client = QBOClient(settings, oauth)
    emitter = ExposureEmitter(settings.exposure_topic)

    async def process_all() -> None:
        await asyncio.gather(*(_process_invoice(client, emitter, entity) for entity in entities))

    background.add_task(process_all)
    return {"status": "accepted"}


__all__ = ["router"]
