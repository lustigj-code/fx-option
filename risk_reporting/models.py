"""Domain models used by the risk reporting service."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict


@dataclass(frozen=True)
class Trade:
    """Represents a simplified FX option trade.

    Attributes
    ----------
    trade_id:
        Unique identifier for the trade.
    currency:
        Currency ISO code of the trade exposure.
    notional:
        Notional size of the trade in the foreign currency.
    spot_rate:
        Spot FX rate used to convert the notional into the base currency.
    delta:
        Sensitivity of the trade value to changes in the underlying spot price.
    volatility:
        Annualised volatility estimate for the underlying asset.
    hedge_ratio:
        Value between 0 and 1 indicating the level of hedging applied.
    """

    trade_id: str
    currency: str
    notional: float
    spot_rate: float
    delta: float
    volatility: float
    hedge_ratio: float = 0.0

    def exposure(self) -> float:
        """Return the base currency exposure of the trade."""

        return self.notional * self.spot_rate


@dataclass(frozen=True)
class RiskReport:
    """Aggregated metrics produced by :class:`RiskService`."""

    gross_exposure: float
    net_exposure: float
    value_at_risk: float
    delta_breakdown: Dict[str, float] = field(default_factory=dict)
    savings_percentages: Dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, float]:
        """Serialize report into a dictionary that can be served externally."""

        return {
            "gross_exposure": self.gross_exposure,
            "net_exposure": self.net_exposure,
            "value_at_risk": self.value_at_risk,
            "delta_breakdown": dict(self.delta_breakdown),
            "savings_percentages": dict(self.savings_percentages),
        }
