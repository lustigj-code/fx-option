"""Core execution models shared with gateway and execution services."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import List


@dataclass
class HedgeOrder:
    """Represents a single hedge order leg."""

    leg_id: str
    quantity: float
    limit_price: float
    status: str = "pending"
    broker_reference: str | None = None


@dataclass
class HedgeRequest:
    """Structured data required to build laddered hedge orders."""

    strategy_id: str
    instrument: str
    side: str
    notional: float
    base_price: float
    levels: int
    price_increment: float
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class HedgeResult:
    """Outcome of attempting to submit hedge orders."""

    request_id: str
    status: str
    orders: List[HedgeOrder]
    created_at: datetime = field(default_factory=datetime.utcnow)
