"""Utilities for mapping due dates to CME MXN option expirations."""
from __future__ import annotations

from datetime import date
from typing import Iterable, List


MONTH_CODES = [
    "F",  # January
    "G",  # February
    "H",  # March
    "J",  # April
    "K",  # May
    "M",  # June
    "N",  # July
    "Q",  # August
    "U",  # September
    "V",  # October
    "X",  # November
    "Z",  # December
]


def _futures_month_code(month: int) -> str:
    return MONTH_CODES[month - 1]


def _roll_month(year: int, month: int) -> tuple[int, int]:
    if month == 12:
        return year + 1, 1
    return year, month + 1


def generate_contract_months(start: date, count: int = 6) -> Iterable[tuple[int, int]]:
    """Yield upcoming futures contract months starting from ``start`` month."""

    year, month = start.year, start.month
    for _ in range(count):
        yield year, month
        year, month = _roll_month(year, month)


def map_due_date_to_expiries(due: date, ladder_depth: int = 2) -> List[str]:
    """Return the nearest futures option expiries for a given due date.

    CME MXN options are listed on the underlying MX futures. We approximate the
    option expiries by taking the two nearest futures contract months that are on
    or after the due date. ``ladder_depth`` controls how many expiries are
    returned, enabling laddered hedges across multiple months.
    """

    if ladder_depth < 1:
        raise ValueError("ladder_depth must be at least 1")

    pivot = due if due >= date.today() else date.today()

    contract_months = []
    for year, month in generate_contract_months(pivot, count=ladder_depth):
        contract_months.append(f"{year}{month:02d}")
    return contract_months


def format_option_symbol(year: int, month: int) -> str:
    """Return the CME option root symbol for a given futures month."""

    return f"MX{_futures_month_code(month)}{str(year)[-1]}"
