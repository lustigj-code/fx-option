from __future__ import annotations

from typing import Protocol

from .domain import MarketDataSnapshot, PricingRequest, QuoteComputation, QuoteReady, Quote


class MarketDataProvider(Protocol):
    """Fetch the market data required to price an exposure."""

    def fetch(self, exposure_id: str) -> MarketDataSnapshot:
        ...


class PricingEngine(Protocol):
    """Calculate a binding quote for the given pricing request."""

    def price(self, request: PricingRequest) -> QuoteComputation:
        ...


class QuoteRepository(Protocol):
    """Persist generated quotes."""

    def save(self, quote: Quote) -> None:
        ...


class MessageBus(Protocol):
    """Publish events to downstream consumers."""

    def publish(self, event: QuoteReady) -> None:
        ...


class Clock(Protocol):
    """Abstraction around the system clock for testability."""

    def now(self):  # pragma: no cover - simple protocol definition
        ...
