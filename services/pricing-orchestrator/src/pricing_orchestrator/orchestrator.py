from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal
from time import perf_counter

from .domain import (
    ExposureCreated,
    MarketDataSnapshot,
    PricingRequest,
    Quote,
    QuoteComputation,
    QuoteOrchestrationResult,
    QuoteReady,
)
from .interfaces import Clock, MarketDataProvider, MessageBus, PricingEngine, QuoteRepository


DEFAULT_CAP = Decimal("0.05")
DEFAULT_VOLATILITY_THRESHOLD = Decimal("0.02")
QUOTE_VALIDITY_SECONDS = 120
DEFAULT_SAFETY_BUFFER_SECONDS = 5
SLA_P99_THRESHOLD_MS = 200.0


class MarketDataError(RuntimeError):
    """Raised when the orchestrator cannot source required market data."""


class SLAExceededError(RuntimeError):
    """Raised when the orchestration runtime breaches the latency SLO."""


@dataclass
class QuoteOrchestrator:
    market_data_provider: MarketDataProvider
    pricing_engine: PricingEngine
    quote_repository: QuoteRepository
    message_bus: MessageBus
    clock: Clock
    safety_buffer_seconds: int = DEFAULT_SAFETY_BUFFER_SECONDS

    def handle_exposure_created(self, event: ExposureCreated) -> QuoteOrchestrationResult:
        """Generate a binding quote for the provided exposure."""

        start = perf_counter()
        now = self.clock.now()

        try:
            market_data = self.market_data_provider.fetch(event.exposure_id)
        except Exception as exc:  # pragma: no cover - defensive safeguard
            return QuoteOrchestrationResult(
                error=f"failed to retrieve market data: {exc}",
                manual_sigma_required=True,
            )

        if not market_data.has_all_values():
            return QuoteOrchestrationResult(
                error="market data incomplete - request manual sigma",
                manual_sigma_required=True,
            )

        pricing_request = self._build_pricing_request(event, market_data)
        computation = self.pricing_engine.price(pricing_request)
        quote_with_validity = self._attach_validity(computation, now)

        self.quote_repository.save(quote_with_validity)
        self.message_bus.publish(
            QuoteReady(
                exposure_id=quote_with_validity.exposure_id,
                price=quote_with_validity.price,
                valid_until=quote_with_validity.valid_until,
            )
        )

        latency_ms = (perf_counter() - start) * 1000
        if latency_ms > SLA_P99_THRESHOLD_MS:
            raise SLAExceededError(
                f"Quote orchestration exceeded latency SLO: {latency_ms:.2f}ms"
            )

        return QuoteOrchestrationResult(
            quote=quote_with_validity,
            latency_ms=latency_ms,
        )

    def _build_pricing_request(
        self, event: ExposureCreated, market_data: MarketDataSnapshot
    ) -> PricingRequest:
        implied_volatility = market_data.implied_volatility or Decimal("0")

        return PricingRequest(
            exposure=event,
            spot=market_data.spot or Decimal("0"),
            implied_volatility=implied_volatility,
            interest_rate=market_data.interest_rate or Decimal("0"),
            cap=DEFAULT_CAP,
            volatility_threshold=DEFAULT_VOLATILITY_THRESHOLD,
        )

    def _attach_validity(self, computation: QuoteComputation, now) -> Quote:
        valid_until = now + timedelta(seconds=QUOTE_VALIDITY_SECONDS)
        return Quote(
            exposure_id=computation.exposure_id,
            price=computation.price,
            valid_until=valid_until,
            safety_buffer_seconds=self.safety_buffer_seconds,
            cap=computation.cap,
            implied_volatility=computation.implied_volatility,
        )
