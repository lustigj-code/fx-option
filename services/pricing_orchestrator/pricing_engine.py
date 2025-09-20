"""Pricing engine implementations."""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Dict, Protocol


class PricingEngine(Protocol):
    """Protocol describing a pricing engine."""

    def price(
        self,
        *,
        spot: float,
        strike: float,
        volatility: float,
        rate: float,
        time_to_expiry: float,
        option_type: str = "call",
    ) -> float:
        """Return the price of an option for the provided parameters."""

    def metadata(self) -> Dict[str, str]:
        """Return metadata describing the pricing model."""


@dataclass(slots=True)
class BlackScholesPricingEngine:
    """Simplified Black-Scholes pricing engine."""

    risk_model: str = "risk-neutral"
    version: str = "1.0.0"

    def price(
        self,
        *,
        spot: float,
        strike: float,
        volatility: float,
        rate: float,
        time_to_expiry: float,
        option_type: str = "call",
    ) -> float:
        if time_to_expiry <= 0:
            intrinsic = max(0.0, spot - strike) if option_type == "call" else max(0.0, strike - spot)
            return intrinsic

        if volatility <= 0:
            discounted_strike = strike * math.exp(-rate * time_to_expiry)
            if option_type == "call":
                return max(0.0, spot - discounted_strike)
            if option_type == "put":
                return max(0.0, discounted_strike - spot)
            raise ValueError(f"Unsupported option type: {option_type}")

        if option_type not in {"call", "put"}:
            raise ValueError(f"Unsupported option type: {option_type}")

        sqrt_t = math.sqrt(time_to_expiry)
        d1 = (
            math.log(spot / strike) + (rate + 0.5 * volatility**2) * time_to_expiry
        ) / (volatility * sqrt_t)
        d2 = d1 - volatility * sqrt_t

        if option_type == "call":
            price = spot * _norm_cdf(d1) - strike * math.exp(-rate * time_to_expiry) * _norm_cdf(d2)
        else:
            price = strike * math.exp(-rate * time_to_expiry) * _norm_cdf(-d2) - spot * _norm_cdf(-d1)

        return price

    def metadata(self) -> Dict[str, str]:
        return {
            "name": "Black-Scholes",
            "version": self.version,
            "riskModel": self.risk_model,
            "assumptions": "log-normal asset returns, continuous hedging",
        }


def _norm_cdf(x: float) -> float:
    """Cumulative distribution function for the standard normal distribution."""

    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))
