from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Dict


@dataclass(frozen=True)
class Quote:
    """Market data quote used for risk metrics."""

    pair: str
    spot: float
    volatility: float

    def simple_var(self, delta: float, days: int) -> float:
        """Return a very simple value-at-risk approximation.

        The method treats ``volatility`` as an annualised percentage move and
        scales it by the square root of time (in trading days).
        """

        if self.spot <= 0:
            raise ValueError("Spot must be positive to compute VaR.")
        if self.volatility < 0:
            raise ValueError("Volatility cannot be negative.")

        if days <= 0:
            # If the option is effectively expired, treat it as a one day move so
            # the caller still receives a non-zero risk number.
            time_scale = 1.0 / 252.0
        else:
            time_scale = days / 252.0
        return abs(delta) * self.spot * self.volatility * time_scale ** 0.5


@dataclass(frozen=True)
class Position:
    """Base representation for exposures and hedges."""

    pair: str
    expiry: date
    side: str
    delta: float
    k_distribution: Dict[str, float] = field(default_factory=dict)

    def signed_delta(self) -> float:
        sign = 1.0 if self.side.lower() in {"buy", "long"} else -1.0
        return sign * self.delta

    def distribution(self) -> Dict[str, float]:
        if not self.k_distribution:
            return {"ATM": 1.0}
        total = sum(self.k_distribution.values())
        if total <= 0:
            return {"ATM": 1.0}
        return {key: value / total for key, value in self.k_distribution.items()}


class Exposure(Position):
    """Risk exposure that still needs to be managed."""


class Hedge(Position):
    """Existing hedge applied to an exposure."""
