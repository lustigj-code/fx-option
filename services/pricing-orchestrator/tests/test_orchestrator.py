from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal

import pytest

from pricing_orchestrator.domain import (
    ExposureCreated,
    MarketDataSnapshot,
    Quote,
    QuoteComputation,
)
from pricing_orchestrator.orchestrator import (
    DEFAULT_CAP,
    DEFAULT_SAFETY_BUFFER_SECONDS,
    QuoteOrchestrator,
    SLAExceededError,
)
from pricing_orchestrator.pricing_engine import BlackScholesPricingEngine


class FakeClock:
    def __init__(self, now: datetime):
        self._now = now

    def now(self) -> datetime:
        return self._now


class FakeMarketDataProvider:
    def __init__(self, snapshot: MarketDataSnapshot):
        self.snapshot = snapshot
        self.calls = []

    def fetch(self, exposure_id: str) -> MarketDataSnapshot:
        self.calls.append(exposure_id)
        return self.snapshot


class FakePricingEngine:
    def __init__(self, price: Decimal):
        self._price = price
        self.requests = []

    def price(self, request):
        self.requests.append(request)
        return QuoteComputation(
            exposure_id=request.exposure.exposure_id,
            price=self._price,
            cap=request.cap,
            implied_volatility=request.implied_volatility,
        )


class FakeQuoteRepository:
    def __init__(self):
        self.saved_quotes = []

    def save(self, quote: Quote):
        self.saved_quotes.append(quote)


class FakeMessageBus:
    def __init__(self):
        self.events = []

    def publish(self, event):
        self.events.append(event)


def make_exposure(exposure_id: str = "exp-1") -> ExposureCreated:
    return ExposureCreated(
        exposure_id=exposure_id,
        currency_pair="EURUSD",
        notional=Decimal("1000000"),
        strike=Decimal("1.05"),
        tenor_days=30,
    )


@pytest.fixture
def orchestrator_dependencies():
    now = datetime(2024, 1, 1, 12, 0, 0)
    clock = FakeClock(now)
    market_data = MarketDataSnapshot(
        spot=Decimal("1.10"),
        implied_volatility=Decimal("0.18"),
        interest_rate=Decimal("0.02"),
    )
    data_provider = FakeMarketDataProvider(market_data)
    pricing_engine = FakePricingEngine(price=Decimal("0.0125"))
    repository = FakeQuoteRepository()
    message_bus = FakeMessageBus()

    orchestrator = QuoteOrchestrator(
        market_data_provider=data_provider,
        pricing_engine=pricing_engine,
        quote_repository=repository,
        message_bus=message_bus,
        clock=clock,
    )

    return orchestrator, data_provider, pricing_engine, repository, message_bus, now


def test_generates_binding_quote(orchestrator_dependencies, monkeypatch):
    orchestrator, data_provider, pricing_engine, repository, message_bus, now = (
        orchestrator_dependencies
    )

    monkeypatch.setattr("pricing_orchestrator.orchestrator.perf_counter", lambda: 0.0)
    result = orchestrator.handle_exposure_created(make_exposure())

    assert result.succeeded()
    saved_quote = repository.saved_quotes[0]
    assert saved_quote.valid_until == now + timedelta(seconds=120)
    assert saved_quote.safety_buffer_seconds == DEFAULT_SAFETY_BUFFER_SECONDS
    assert saved_quote.cap == DEFAULT_CAP
    assert message_bus.events[0].exposure_id == saved_quote.exposure_id
    assert result.quote == saved_quote


def test_missing_market_data_requests_manual_sigma(orchestrator_dependencies, monkeypatch):
    orchestrator, data_provider, pricing_engine, repository, message_bus, now = (
        orchestrator_dependencies
    )
    data_provider.snapshot = MarketDataSnapshot(spot=None, implied_volatility=None, interest_rate=None)

    monkeypatch.setattr("pricing_orchestrator.orchestrator.perf_counter", lambda: 0.0)
    result = orchestrator.handle_exposure_created(make_exposure())

    assert not result.succeeded()
    assert result.manual_sigma_required is True
    assert "manual sigma" in result.error.lower()
    assert repository.saved_quotes == []
    assert message_bus.events == []


def test_latency_sla_violation_raises(monkeypatch, orchestrator_dependencies):
    orchestrator, data_provider, pricing_engine, repository, message_bus, now = (
        orchestrator_dependencies
    )

    calls = {"count": 0}

    def fake_perf_counter():
        if calls["count"] == 0:
            calls["count"] += 1
            return 0.0
        return 0.25

    monkeypatch.setattr("pricing_orchestrator.orchestrator.perf_counter", fake_perf_counter)

    with pytest.raises(SLAExceededError):
        orchestrator.handle_exposure_created(make_exposure())

    assert repository.saved_quotes, "quote should still be persisted before SLA enforcement"
    assert message_bus.events, "event should be emitted before SLA enforcement"


def test_black_scholes_engine_prices_option(monkeypatch):
    now = datetime(2024, 1, 1, 12, 0, 0)
    market_data = MarketDataSnapshot(
        spot=Decimal("1.10"),
        implied_volatility=Decimal("0.20"),
        interest_rate=Decimal("0.01"),
    )
    provider = FakeMarketDataProvider(market_data)
    repository = FakeQuoteRepository()
    bus = FakeMessageBus()
    clock = FakeClock(now)
    engine = BlackScholesPricingEngine()

    orchestrator = QuoteOrchestrator(
        market_data_provider=provider,
        pricing_engine=engine,
        quote_repository=repository,
        message_bus=bus,
        clock=clock,
    )

    monkeypatch.setattr("pricing_orchestrator.orchestrator.perf_counter", lambda: 0.0)
    result = orchestrator.handle_exposure_created(make_exposure("exp-test"))

    assert result.succeeded()
    quote = result.quote
    assert quote is not None
    assert quote.price > 0
