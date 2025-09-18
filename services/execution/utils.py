"""Utility helpers used by the execution service."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Iterable, List


def third_wednesday(year: int, month: int) -> date:
    """Return the third Wednesday for the provided month."""

    first_day = date(year, month, 1)
    # Weekday Monday=0 ... Sunday=6. Wednesday is 2.
    weekday = first_day.weekday()
    # Days until first Wednesday.
    days_until_wed = (2 - weekday) % 7
    first_wednesday = first_day + timedelta(days=days_until_wed)
    return first_wednesday + timedelta(weeks=2)


def monthly_expiries(start: date, months_ahead: int = 12) -> List[date]:
    """Generate CME style monthly FX option expiries (third Wednesday) from start."""

    expiries: List[date] = []
    year = start.year
    month = start.month
    for _ in range(months_ahead):
        expiries.append(third_wednesday(year, month))
        month += 1
        if month > 12:
            month = 1
            year += 1
    return sorted(expiries)


def nearest_expiries(due_date: date, expiries: Iterable[date], count: int = 2) -> List[date]:
    """Return the ``count`` expiries that are on or after ``due_date``."""

    sorted_expiries = sorted(expiries)
    eligible = [exp for exp in sorted_expiries if exp >= due_date]
    if not eligible:
        eligible = sorted_expiries[-count:]
    return eligible[:count]


def ladder_strikes(base_strike: float, layers: int, step: float) -> List[float]:
    """Return ladder strikes centered around ``base_strike``."""

    if layers <= 1:
        return [base_strike]

    strikes: List[float] = []
    half = layers // 2
    for i in range(-half, half + 1):
        if layers % 2 == 0 and i == 0:
            # Skip zero offset for even layers to avoid duplicates; we'll produce
            # two central strikes around the base.
            continue
        offset = i * step
        strikes.append(round(base_strike + offset, 10))
    strikes.sort()
    return strikes


def allocate_quantity(total: int, buckets: int) -> List[int]:
    """Allocate ``total`` quantity across ``buckets`` as evenly as possible."""

    if buckets <= 0:
        raise ValueError("buckets must be positive")

    base = total // buckets
    remainder = total % buckets
    allocation: List[int] = []
    for index in range(buckets):
        qty = base + (1 if index < remainder else 0)
        allocation.append(qty)
    return allocation


def adjusted_limit_price(side: str, base_price: float, slippage: float) -> float:
    """Return a limit price adjusted for the allowed slippage."""

    if slippage <= 0:
        return round(base_price, 10)
    if side.upper() == "BUY":
        return round(base_price + slippage, 10)
    return round(base_price - slippage, 10)
