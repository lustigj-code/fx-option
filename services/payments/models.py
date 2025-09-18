"""Dataclasses representing persistent entities."""
from __future__ import annotations

import enum
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional


class PaymentStatus(str, enum.Enum):
    created = "created"
    pending = "pending"
    succeeded = "succeeded"
    settled = "settled"
    failed = "failed"


class PayoutStatus(str, enum.Enum):
    created = "created"
    processing = "processing"
    paid = "paid"
    failed = "failed"


@dataclass
class Payment:
    id: str
    provider: str
    amount: Decimal
    currency: str
    status: PaymentStatus
    customer_meta: Dict[str, Any]
    checkout_link: Optional[str]
    bank_debit_intent: Optional[str]
    idempotency_key: Optional[str]
    external_reference: Optional[str]
    created_at: datetime
    updated_at: datetime


@dataclass
class Beneficiary:
    id: str
    currency: str
    meta: Dict[str, Any]
    idempotency_key: Optional[str]
    created_at: datetime
    updated_at: datetime


@dataclass
class Payout:
    id: str
    amount: Decimal
    currency: str
    status: PayoutStatus
    beneficiary_id: str
    idempotency_key: Optional[str]
    external_reference: Optional[str]
    created_at: datetime
    updated_at: datetime


@dataclass
class FeeBreakdown:
    id: str
    payment_id: str
    description: str
    amount: Decimal


__all__ = [
    "Payment",
    "Beneficiary",
    "Payout",
    "FeeBreakdown",
    "PaymentStatus",
    "PayoutStatus",
]
