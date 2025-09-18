from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional


@dataclass(frozen=True)
class ExposureCreated:
    """Event emitted when a new exposure is ready for pricing."""

    exposure_id: str
    currency_pair: str
    notional: Decimal
    strike: Decimal
    tenor_days: int


@dataclass(frozen=True)
class MarketDataSnapshot:
    """Container for the market data required to price an exposure."""

    spot: Optional[Decimal]
    implied_volatility: Optional[Decimal]
    interest_rate: Optional[Decimal]

    def has_all_values(self) -> bool:
        return (
            self.spot is not None
            and self.implied_volatility is not None
            and self.interest_rate is not None
        )


@dataclass(frozen=True)
class PricingRequest:
    exposure: ExposureCreated
    spot: Decimal
    implied_volatility: Decimal
    interest_rate: Decimal
    cap: Decimal
    volatility_threshold: Decimal


@dataclass(frozen=True)
class QuoteComputation:
    exposure_id: str
    price: Decimal
    cap: Decimal
    implied_volatility: Decimal


@dataclass(frozen=True)
class Quote:
    exposure_id: str
    price: Decimal
    valid_until: datetime
    safety_buffer_seconds: int
    cap: Decimal
    implied_volatility: Decimal

    def with_safety_buffer(self) -> "Quote":
        """Return a quote adjusted for the configured safety buffer."""

        return Quote(
            exposure_id=self.exposure_id,
            price=self.price,
            valid_until=self.valid_until - timedelta(seconds=self.safety_buffer_seconds),
            safety_buffer_seconds=self.safety_buffer_seconds,
            cap=self.cap,
            implied_volatility=self.implied_volatility,
        )


@dataclass(frozen=True)
class QuoteReady:
    exposure_id: str
    price: Decimal
    valid_until: datetime


@dataclass(frozen=True)
class QuoteOrchestrationResult:
    quote: Optional[Quote] = None
    error: Optional[str] = None
    manual_sigma_required: bool = False
    latency_ms: float = 0.0

    def succeeded(self) -> bool:
        return self.quote is not None and self.error is None
