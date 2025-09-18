"""Webhook helpers."""
from __future__ import annotations

import json
from decimal import Decimal
from typing import Dict, Optional

from .config import get_settings
from .providers.dlocal_provider import dlocal_collect_provider
from .providers.stripe_provider import stripe_collect_provider
from .providers.wise_provider import wise_payout_provider
from .service import mark_payment_succeeded, mark_payout_paid, settle_payment_by_id
from .utils import verify_signature


class WebhookError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def _decode_payload(raw_body: bytes) -> Dict[str, object]:
    try:
        return json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError as exc:  # pragma: no cover
        raise WebhookError("Invalid JSON payload") from exc


def handle_stripe_webhook(raw_body: bytes, signature: str) -> Optional[str]:
    settings = get_settings()
    if not verify_signature(settings.stripe_webhook_secret, raw_body, signature):
        raise WebhookError("Invalid Stripe signature")

    payload = _decode_payload(raw_body)
    outcome = stripe_collect_provider.interpret_webhook(payload)
    if not outcome:
        return None

    payment_id = outcome.get("payment_id")
    amount = Decimal(str(outcome.get("amount", "0")))
    currency = str(outcome.get("currency", "USD"))
    if payment_id:
        event = settle_payment_by_id(payment_id, amount=amount, currency=currency)
    else:
        event = mark_payment_succeeded(
            payment_external_reference=str(outcome.get("external_reference", "")),
            payment_id="",
            amount=amount,
            currency=currency,
        )
    return event.payment_id if event else None


def handle_dlocal_webhook(raw_body: bytes, signature: str) -> Optional[str]:
    settings = get_settings()
    if not verify_signature(settings.dlocal_webhook_secret, raw_body, signature):
        raise WebhookError("Invalid dLocal signature")

    payload = _decode_payload(raw_body)
    outcome = dlocal_collect_provider.interpret_webhook(payload)
    if not outcome:
        return None

    payment_id = outcome.get("payment_id")
    amount = Decimal(str(outcome.get("amount", "0")))
    currency = str(outcome.get("currency", "USD"))
    if payment_id:
        event = settle_payment_by_id(payment_id, amount=amount, currency=currency)
    else:
        event = mark_payment_succeeded(
            payment_external_reference=str(outcome.get("external_reference", "")),
            payment_id="",
            amount=amount,
            currency=currency,
        )
    return event.payment_id if event else None


def handle_wise_webhook(raw_body: bytes, signature: str) -> Optional[str]:
    settings = get_settings()
    if not verify_signature(settings.wise_webhook_secret, raw_body, signature):
        raise WebhookError("Invalid Wise signature")

    payload = _decode_payload(raw_body)
    resource_id = wise_payout_provider.interpret_webhook(payload)
    if not resource_id:
        return None

    payout = mark_payout_paid(resource_id)
    return payout.id if payout else None


__all__ = [
    "handle_stripe_webhook",
    "handle_dlocal_webhook",
    "handle_wise_webhook",
    "WebhookError",
]
