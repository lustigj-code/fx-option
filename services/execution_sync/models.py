"""Data models for the execution service."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, date
from enum import Enum
from typing import Any, Dict, List, Optional


class OrderSide(str, Enum):
    """Supported order sides."""

    BUY = "BUY"
    SELL = "SELL"


class OptionRight(str, Enum):
    """Supported option rights."""

    CALL = "C"
    PUT = "P"


@dataclass(frozen=True)
class HedgeRequest:
    """Request describing the hedge that should be executed."""

    due_date: date
    quantity: int
    side: OrderSide
    strike: float
    right: OptionRight
    limit_price: float
    slippage: float = 0.0
    ladder_layers: int = 1
    strike_step: float = 0.0025
    expiry_count: int = 2
    account: Optional[str] = None
    client_order_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class HedgeOrder:
    """Represents a single order submitted to the broker."""

    contract_month: date
    strike: float
    right: OptionRight
    quantity: int
    side: OrderSide
    limit_price: float
    ib_order_id: Optional[int] = None
    client_order_id: Optional[str] = None
    account: Optional[str] = None
    status: str = "CREATED"
    fills: List[Dict[str, Any]] = field(default_factory=list)
    submitted_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None


@dataclass
class HedgeResult:
    """Result returned to callers after a hedge has been placed."""

    orders: List[HedgeOrder]
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class HedgePlacedEvent:
    """Event emitted once the hedge orders have been submitted."""

    timestamp: datetime
    request: HedgeRequest
    result: HedgeResult
