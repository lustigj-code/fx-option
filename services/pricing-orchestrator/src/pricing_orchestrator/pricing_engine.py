"""Pricing engines used by the quote orchestrator."""
from __future__ import annotations

from decimal import Decimal, getcontext
from math import erf, exp, log, sqrt

from .domain import PricingRequest, QuoteComputation
from .interfaces import PricingEngine


def _norm_cdf(value: float) -> float:
    """Return the cumulative density for a standard normal distribution."""

    return 0.5 * (1.0 + erf(value / sqrt(2.0)))


class BlackScholesPricingEngine(PricingEngine):
    """Simple Black–Scholes based engine for ATM European options."""

    def __init__(self, minimum_tenor_days: int = 1) -> None:
        self.minimum_tenor_days = max(minimum_tenor_days, 1)

    def price(self, request: PricingRequest) -> QuoteComputation:
        exposure = request.exposure

        tenor_days = max(exposure.tenor_days, self.minimum_tenor_days)
        time_to_maturity = tenor_days / 365.0

        spot = float(request.spot)
        strike = float(exposure.strike)
        volatility = max(float(request.implied_volatility), 1e-6)
        rate = float(request.interest_rate)

        if spot <= 0 or strike <= 0 or time_to_maturity <= 0:
            premium = Decimal("0")
        else:
            variance = volatility * sqrt(time_to_maturity)
            d1 = (log(spot / strike) + (rate + 0.5 * volatility**2) * time_to_maturity) / variance
            d2 = d1 - variance

            call_price = spot * _norm_cdf(d1) - strike * exp(-rate * time_to_maturity) * _norm_cdf(d2)
            premium = Decimal(call_price).quantize(Decimal("0.0001"))

        # Enforce configured cap from the orchestrator request.
        if premium > request.cap:
            premium = request.cap

        return QuoteComputation(
            exposure_id=exposure.exposure_id,
            price=premium,
            cap=request.cap,
            implied_volatility=request.implied_volatility,
        )

