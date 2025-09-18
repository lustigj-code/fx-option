"""Abstract base classes for payment providers."""
from __future__ import annotations

import random
import random
import string
from dataclasses import dataclass
from decimal import Decimal
from typing import Dict, Optional


@dataclass
class CollectResult:
    provider: str
    external_reference: str
    checkout_link: Optional[str]
    bank_debit_intent: Optional[str]
    status: str


@dataclass
class PayoutResult:
    provider: str
    external_reference: str
    status: str


def _random_reference(prefix: str) -> str:
    return prefix + "_" + "".join(random.choices(string.ascii_lowercase + string.digits, k=12))


class CollectProvider:
    name = "base"

    def create_collect(
        self, amount: Decimal, currency: str, customer_meta: Dict[str, object]
    ) -> CollectResult:
        raise NotImplementedError

    def interpret_webhook(self, payload: Dict[str, object]) -> Optional[Dict[str, object]]:
        raise NotImplementedError


class PayoutProvider:
    name = "base"

    def create_payout(
        self, amount: Decimal, currency: str, beneficiary_meta: Dict[str, object]
    ) -> PayoutResult:
        raise NotImplementedError

    def interpret_webhook(self, payload: Dict[str, object]) -> Optional[str]:
        raise NotImplementedError


__all__ = [
    "CollectProvider",
    "PayoutProvider",
    "CollectResult",
    "PayoutResult",
]
