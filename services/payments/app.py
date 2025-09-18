"""Lightweight application facade exposing collect/payout APIs."""
from __future__ import annotations

import json
from dataclasses import asdict
from decimal import Decimal
from typing import Dict, Optional, Tuple

from .database import initialize_schema
from .queue import event_queue
from .schemas import CollectRequest, CollectResponse, PayoutRequest, PayoutResponse
from .service import create_collect, create_payout
from .webhooks import handle_dlocal_webhook, handle_stripe_webhook, handle_wise_webhook, WebhookError


class PaymentsAPI:
    """Minimal HTTP-agnostic interface for the payments service."""

    def __init__(self) -> None:
        initialize_schema()

    @staticmethod
    def _parse_collect_request(body: Dict[str, object]) -> CollectRequest:
        return CollectRequest(
            amount=Decimal(str(body["amount"])),
            currency=str(body["currency"]),
            customer_meta=dict(body.get("customer_meta", {})),
        )

    @staticmethod
    def _parse_payout_request(body: Dict[str, object]) -> PayoutRequest:
        return PayoutRequest(
            amount=Decimal(str(body["amount"])),
            currency=str(body["currency"]),
            beneficiary_meta=dict(body.get("beneficiary_meta", {})),
        )

    def post_collect_create(self, body: Dict[str, object], headers: Optional[Dict[str, str]] = None) -> Tuple[int, Dict[str, object]]:
        headers = headers or {}
        request = self._parse_collect_request(body)
        response = create_collect(request, headers.get("Idempotency-Key"))
        payload = asdict(response)
        payload["status"] = response.status.value
        return 200, payload

    def post_payout_create(self, body: Dict[str, object], headers: Optional[Dict[str, str]] = None) -> Tuple[int, Dict[str, object]]:
        headers = headers or {}
        request = self._parse_payout_request(body)
        response = create_payout(request, headers.get("Idempotency-Key"))
        payload = asdict(response)
        payload["status"] = response.status.value
        return 200, payload

    def post_webhook(self, provider: str, body: bytes, headers: Dict[str, str]) -> Tuple[int, Dict[str, object]]:
        if provider == "stripe":
            signature = headers.get("Stripe-Signature", "")
            try:
                payment_id = handle_stripe_webhook(body, signature)
            except WebhookError as exc:
                return 400, {"error": exc.message}
            return 200, {"payment_id": payment_id}
        if provider == "dlocal":
            signature = headers.get("Dlocal-Signature", "")
            try:
                payment_id = handle_dlocal_webhook(body, signature)
            except WebhookError as exc:
                return 400, {"error": exc.message}
            return 200, {"payment_id": payment_id}
        if provider == "wise":
            signature = headers.get("Wise-Signature", "")
            try:
                payout_id = handle_wise_webhook(body, signature)
            except WebhookError as exc:
                return 400, {"error": exc.message}
            return 200, {"payout_id": payout_id}
        return 404, {"error": "Unknown provider"}

    def get_events(self) -> Tuple[int, Dict[str, object]]:
        events = []
        for event in event_queue.drain():
            payload = event.payload.__dict__ if hasattr(event.payload, "__dict__") else str(event.payload)
            events.append({"name": event.name, "payload": payload, "published_at": event.published_at.isoformat()})
        return 200, {"events": events}


app = PaymentsAPI()

__all__ = ["PaymentsAPI", "app"]
