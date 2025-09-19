"""REST gateway stitching together pricing, risk, and execution primitives."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Dict, List, Optional

import sys

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

PRICING_SRC = Path(__file__).resolve().parents[1] / "pricing-orchestrator" / "src"
if PRICING_SRC.exists() and str(PRICING_SRC) not in sys.path:  # pragma: no cover - path hygiene
    sys.path.append(str(PRICING_SRC))

from pricing_orchestrator.domain import ExposureCreated, MarketDataSnapshot, Quote
from pricing_orchestrator.interfaces import Clock, MarketDataProvider, MessageBus, PricingEngine, QuoteRepository
from pricing_orchestrator.orchestrator import QuoteOrchestrator
from pricing_orchestrator.domain import QuoteComputation

from services.risk.service import RiskService


class MarketDataPayload(BaseModel):
    spot: Decimal = Field(..., gt=0)
    implied_volatility: Decimal = Field(..., ge=0)
    interest_rate: Decimal = Field(...)


class ExposurePayload(BaseModel):
    exposure_id: str = Field(..., alias="id")
    currency_pair: str
    notional: Decimal = Field(..., gt=0)
    strike: Decimal = Field(..., gt=0)
    tenor_days: int = Field(..., gt=0)
    market_data: MarketDataPayload


class BindingQuoteResponse(BaseModel):
    exposure_id: str
    price: Decimal
    valid_until: datetime
    implied_volatility: Decimal
    cap: Decimal
    safety_buffer_seconds: int
    latency_ms: float


class QuoteMessage(BaseModel):
    exposure_id: str
    price: Decimal
    valid_until: datetime


class BindingQuoteResult(BaseModel):
    quote: BindingQuoteResponse
    downstream_event: Optional[QuoteMessage] = None


class QuoteInput(BaseModel):
    pair: str
    spot: float
    volatility: float


class PositionInput(BaseModel):
    pair: str
    expiry: str
    side: str
    delta: float
    k_distribution: Optional[Dict[str, float]] = None


class QuotePlanRequest(BaseModel):
    quotes: List[QuoteInput]
    exposures: List[PositionInput]
    hedges: List[PositionInput] = Field(default_factory=list)


class InMemoryMarketDataProvider(MarketDataProvider):
    """Markets snapshots keyed by exposure identifiers."""

    def __init__(self, snapshots: Dict[str, MarketDataSnapshot]):
        self._snapshots = snapshots

    def fetch(self, exposure_id: str) -> MarketDataSnapshot:
        try:
            return self._snapshots[exposure_id]
        except KeyError as exc:
            raise RuntimeError(f"no market data found for exposure {exposure_id}") from exc


class SimplePricingEngine(PricingEngine):
    """Deterministic pricing stub mirroring the portal's quote heuristics."""

    def price(self, request):
        tenor_years = Decimal(request.exposure.tenor_days) / Decimal(365)
        base_premium = request.implied_volatility * Decimal("0.035")
        carry = (request.interest_rate or Decimal(0)) * tenor_years
        premium_ratio = Decimal("0.01") + base_premium + carry
        premium_ratio = max(premium_ratio, Decimal("0.0005"))
        price = request.spot * premium_ratio
        return QuoteComputation(
            exposure_id=request.exposure.exposure_id,
            price=price.quantize(Decimal("0.0001")),
            cap=request.cap,
            implied_volatility=request.implied_volatility,
        )


class InMemoryQuoteRepository(QuoteRepository):
    def __init__(self) -> None:
        self._quotes: Dict[str, Quote] = {}

    def save(self, quote: Quote) -> None:
        self._quotes[quote.exposure_id] = quote

    def get(self, exposure_id: str) -> Optional[Quote]:
        return self._quotes.get(exposure_id)


class InMemoryBus(MessageBus):
    def __init__(self) -> None:
        self.events: List[QuoteMessage] = []

    def publish(self, event) -> None:
        self.events.append(
            QuoteMessage(
                exposure_id=event.exposure_id,
                price=Decimal(event.price),
                valid_until=event.valid_until,
            )
        )


@dataclass
class UTCClock(Clock):
    def now(self) -> datetime:
        return datetime.now(timezone.utc)


def _orchestrate_quote(payload: ExposurePayload) -> tuple[QuoteOrchestrationResult, List[QuoteMessage]]:
    exposure = ExposureCreated(
        exposure_id=payload.exposure_id,
        currency_pair=payload.currency_pair,
        notional=payload.notional,
        strike=payload.strike,
        tenor_days=payload.tenor_days,
    )
    market_snapshot = MarketDataSnapshot(
        spot=payload.market_data.spot,
        implied_volatility=payload.market_data.implied_volatility,
        interest_rate=payload.market_data.interest_rate,
    )
    provider = InMemoryMarketDataProvider({payload.exposure_id: market_snapshot})
    repo = InMemoryQuoteRepository()
    bus = InMemoryBus()
    orchestrator = QuoteOrchestrator(
        market_data_provider=provider,
        pricing_engine=SimplePricingEngine(),
        quote_repository=repo,
        message_bus=bus,
        clock=UTCClock(),
    )
    result = orchestrator.handle_exposure_created(exposure)
    if result.quote:
        repo.save(result.quote)
    return result, bus.events


def create_app() -> FastAPI:
    app = FastAPI(title="FX Option Gateway")

    @app.post("/api/quotes/binding", response_model=BindingQuoteResult)
    def binding_quote(payload: ExposurePayload) -> JSONResponse:
        result, events = _orchestrate_quote(payload)
        if not result.succeeded():
            raise HTTPException(status_code=400, detail=result.error or "quote generation failed")
        quote = result.quote
        assert quote is not None  # for mypy
        response = BindingQuoteResponse(
            exposure_id=quote.exposure_id,
            price=quote.price,
            valid_until=quote.valid_until,
            implied_volatility=quote.implied_volatility,
            cap=quote.cap,
            safety_buffer_seconds=quote.safety_buffer_seconds,
            latency_ms=result.latency_ms,
        )
        downstream = events[0] if events else None
        return JSONResponse(
            content=BindingQuoteResult(quote=response, downstream_event=downstream).model_dump(mode="json"),
            status_code=200,
        )

    @app.post("/api/risk/plan")
    def risk_plan(request: QuotePlanRequest):
        quotes_payload = [quote.model_dump() for quote in request.quotes]
        exposures_payload = [exposure.model_dump() for exposure in request.exposures]
        hedges_payload = [hedge.model_dump() for hedge in request.hedges]
        service = RiskService(quotes=quotes_payload)
        plan = service.generate_plan(exposures_payload, hedges_payload)
        return JSONResponse(content=plan, status_code=200)

    return app


app = create_app()
