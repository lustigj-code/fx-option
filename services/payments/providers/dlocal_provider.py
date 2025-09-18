"""Mock dLocal collect provider."""
from __future__ import annotations

import json
from decimal import Decimal
from typing import Dict, Optional

from ..config import get_settings
from ..utils import retry_with_backoff
from .base import CollectProvider, CollectResult, _random_reference


class DLocalCollectProvider(CollectProvider):
    name = "dlocal_bank_debit"

    def __init__(self) -> None:
        self.settings = get_settings()

    def create_collect(
        self, amount: Decimal, currency: str, customer_meta: Dict[str, object]
    ) -> CollectResult:
        def _call() -> CollectResult:
            if not self.settings.dlocal_api_key:
                raise RuntimeError("dLocal API key missing")
            reference = _random_reference("dl")
            mandate = {
                "mandate_id": reference,
                "bank": customer_meta.get("bank", "sandbox-bank"),
            }
            return CollectResult(
                provider=self.name,
                external_reference=reference,
                checkout_link=None,
                bank_debit_intent=json.dumps(mandate),
                status="pending",
            )

        return retry_with_backoff(_call)

    def interpret_webhook(self, payload: Dict[str, object]) -> Optional[Dict[str, object]]:
        if payload.get("event") == "payment_updated" and payload.get("status") == "PAID":
            return {
                "external_reference": payload.get("id"),
                "payment_id": payload.get("metadata", {}).get("payment_id"),
                "amount": Decimal(str(payload.get("amount", "0"))) / Decimal("100"),
                "currency": payload.get("currency", "usd").upper(),
            }
        return None


dlocal_collect_provider = DLocalCollectProvider()

__all__ = ["dlocal_collect_provider", "DLocalCollectProvider"]
