"""Order models and utilities for the execution service."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional

from ib_insync import LimitOrder, Order


@dataclass(slots=True)
class HedgeLeg:
    expiry: str
    quantity: int
    limit_price: float


@dataclass(slots=True)
class HedgeRequest:
    due_date: datetime
    strike: float
    right: str
    action: str  # BUY or SELL
    quantity: int
    reference_price: float
    ladder_depth: int = 2
    max_slippage: Optional[float] = None

    def normalized_action(self) -> str:
        action = self.action.upper()
        if action not in {"BUY", "SELL"}:
            raise ValueError("action must be BUY or SELL")
        return action

    def normalized_right(self) -> str:
        right = self.right.upper()
        if right not in {"C", "P"}:
            raise ValueError("right must be C or P")
        return right

    def normalized_due_date(self) -> datetime:
        due = self.due_date
        if due.tzinfo is None:
            return due.replace(tzinfo=timezone.utc)
        return due.astimezone(timezone.utc)


@dataclass(slots=True)
class HedgeOrder:
    """Details about a placed hedge order."""

    ib_order_id: int
    perm_id: Optional[int]
    account: str
    action: str
    quantity: int
    limit_price: float
    expiry: str
    strike: float
    right: str
    placed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass(slots=True)
class HedgeFill:
    ib_order_id: int
    fill_price: float
    filled: int
    remaining: int
    status: str
    last_liquidity: Optional[str]
    occurred_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


def build_limit_order(action: str, quantity: int, limit_price: float) -> Order:
    """Create an IB limit order."""

    return LimitOrder(action=action, totalQuantity=quantity, lmtPrice=limit_price)


def allocate_ladder(quantity: int, ladder_depth: int) -> List[int]:
    """Split the quantity evenly across the laddered expiries."""

    base = quantity // ladder_depth
    remainder = quantity % ladder_depth

    allocations = []
    for idx in range(ladder_depth):
        leg_qty = base + (1 if idx < remainder else 0)
        allocations.append(leg_qty)
    return allocations
