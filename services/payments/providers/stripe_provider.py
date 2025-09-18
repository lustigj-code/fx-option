"""Mock Stripe ACH provider integration."""
from __future__ import annotations

from decimal import Decimal
from typing import Dict, Optional

from ..config import get_settings
from ..utils import retry_with_backoff
from .base import CollectProvider, CollectResult, _random_reference


class StripeACHCollectProvider(CollectProvider):
    name = "stripe_ach"

    def __init__(self) -> None:
        self.settings = get_settings()

    def create_collect(
        self, amount: Decimal, currency: str, customer_meta: Dict[str, object]
    ) -> CollectResult:
        def _call() -> CollectResult:
            # Leverage the configured sandbox API key to demonstrate dependency usage.
            api_key = self.settings.stripe_api_key
            if not api_key:
                raise RuntimeError("Stripe API key is not configured")
            reference = _random_reference("pi")
            checkout_link = f"https://sandbox.stripe.com/pay/{reference}"
            return CollectResult(
                provider=self.name,
                external_reference=reference,
                checkout_link=checkout_link,
                bank_debit_intent=None,
                status="pending",
            )

        return retry_with_backoff(_call)

    def interpret_webhook(self, payload: Dict[str, object]) -> Optional[Dict[str, object]]:
        event_type = payload.get("type")
        data = payload.get("data", {})
        if event_type == "payment_intent.succeeded":
            intent = data.get("object", {})
            return {
                "external_reference": intent.get("id"),
                "payment_id": intent.get("metadata", {}).get("payment_id"),
                "amount": Decimal(str(intent.get("amount", "0"))) / Decimal("100"),
                "currency": intent.get("currency", "usd").upper(),
            }
        return None


stripe_collect_provider = StripeACHCollectProvider()

__all__ = ["stripe_collect_provider", "StripeACHCollectProvider"]
