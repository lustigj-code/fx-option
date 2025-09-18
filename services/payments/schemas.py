"""Dataclasses representing API payloads and events."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional

from .models import PaymentStatus, PayoutStatus


@dataclass
class CollectRequest:
    amount: Decimal
    currency: str
    customer_meta: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CollectResponse:
    payment_id: str
    provider: str
    status: PaymentStatus
    checkout_link: Optional[str] = None
    bank_debit_intent: Optional[str] = None


@dataclass
class PayoutRequest:
    amount: Decimal
    currency: str
    beneficiary_meta: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PayoutResponse:
    payout_id: str
    beneficiary_id: str
    status: PayoutStatus


@dataclass
class PaymentSettledEvent:
    payment_id: str
    amount: Decimal
    currency: str
    occurred_at: datetime


__all__ = [
    "CollectRequest",
    "CollectResponse",
    "PayoutRequest",
    "PayoutResponse",
    "PaymentSettledEvent",
]
