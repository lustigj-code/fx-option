"""Mock Wise payouts provider integration."""
from __future__ import annotations

from decimal import Decimal
from typing import Dict, Optional

from ..config import get_settings
from ..utils import retry_with_backoff
from .base import PayoutProvider, PayoutResult, _random_reference


class WisePayoutProvider(PayoutProvider):
    name = "wise"

    def __init__(self) -> None:
        self.settings = get_settings()

    def create_payout(
        self, amount: Decimal, currency: str, beneficiary_meta: Dict[str, object]
    ) -> PayoutResult:
        def _call() -> PayoutResult:
            if not self.settings.wise_api_key:
                raise RuntimeError("Wise API key missing")
            reference = _random_reference("wise")
            return PayoutResult(
                provider=self.name,
                external_reference=reference,
                status="processing",
            )

        return retry_with_backoff(_call)

    def interpret_webhook(self, payload: Dict[str, object]) -> Optional[str]:
        if payload.get("event_type") == "transfers#state-change" and payload.get("current_state") == "outgoing_payment_sent":
            return payload.get("resource", {}).get("id")
        return None


wise_payout_provider = WisePayoutProvider()

__all__ = ["wise_payout_provider", "WisePayoutProvider"]
