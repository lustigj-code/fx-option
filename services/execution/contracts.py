"""Contract utilities for CME MXN options."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Optional

from ib_insync import Contract, FutureOption

from .due_date import format_option_symbol


@dataclass(slots=True)
class MXNOptionSpec:
    """Description for the MXN option contract to be traded."""

    strike: float
    right: str  # "C" or "P"
    multiplier: str = "5000000"
    exchange: str = "GLOBEX"
    trading_class: str = "MX"
    currency: str = "USD"

    def normalize(self) -> "MXNOptionSpec":
        right = self.right.upper()
        if right not in {"C", "P"}:
            raise ValueError("right must be 'C' or 'P'")
        return MXNOptionSpec(
            strike=self.strike,
            right=right,
            multiplier=self.multiplier,
            exchange=self.exchange,
            trading_class=self.trading_class,
            currency=self.currency,
        )


def build_option_contract(
    expiry: str,
    option: MXNOptionSpec,
    use_fop: bool = True,
    last_trade_date: Optional[date] = None,
) -> Contract:
    """Create an IB contract for the MXN option on futures."""

    normalized = option.normalize()

    if use_fop:
        contract: Contract = FutureOption(
            symbol="MX",
            lastTradeDateOrContractMonth=expiry,
            strike=normalized.strike,
            right=normalized.right,
            multiplier=normalized.multiplier,
            exchange=normalized.exchange,
            currency=normalized.currency,
            tradingClass=normalized.trading_class,
        )
    else:
        symbol = format_option_symbol(int(expiry[:4]), int(expiry[4:]))
        contract = Contract(
            secType="OPT",
            symbol=symbol,
            lastTradeDateOrContractMonth=expiry,
            strike=normalized.strike,
            right=normalized.right,
            exchange=normalized.exchange,
            currency=normalized.currency,
            multiplier=normalized.multiplier,
            tradingClass=normalized.trading_class,
        )

    if last_trade_date is not None:
        contract.lastTradeDateOrContractMonth = last_trade_date.strftime("%Y%m%d")

    return contract
