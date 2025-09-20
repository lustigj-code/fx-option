"""REST gateway stitching together pricing, risk, and execution primitives."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

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
from pricing_orchestrator.pricing_engine import BlackScholesPricingEngine

from services.execution_sync.events import InMemoryEventEmitter
from services.execution_sync.ibkr import IBKRConfig
from services.execution_sync.models import HedgeOrder, HedgePlacedEvent, HedgeRequest as SyncHedgeRequest, OptionRight, OrderSide
from services.execution_sync.service import ExecutionService as SyncExecutionService
from services.execution_sync.storage import OrderStorage
from services.risk.service import RiskService
from services.gateway.settings import GatewaySettings, get_settings

DEFAULT_EXECUTION_ROOT = Path(__file__).resolve().parents[2] / "data" / "execution-orders"


class DryRunIBKRClient:
    """Minimal IBKR client used for sandbox execution inside the gateway."""

    def __init__(self) -> None:
        self._next_order_id = 1

    def ensure_connected(self) -> None:  # pragma: no cover - noop
        return None

    def execute_order(self, order: HedgeOrder) -> HedgeOrder:
        now = datetime.now(timezone.utc)
        order.ib_order_id = order.ib_order_id or self._next_order_id
        self._next_order_id += 1
        order.submitted_at = now
        order.acknowledged_at = now
        order.status = "FILLED"
        if not order.fills:
            order.fills.append(
                {
                    "price": order.limit_price,
                    "qty": order.quantity,
                    "time": now.isoformat(),
                }
            )
        return order


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
    pricing_model: str


class QuoteMessage(BaseModel):
    exposure_id: str
    price: Decimal
    valid_until: datetime


class BindingQuoteResult(BaseModel):
    quote: BindingQuoteResponse
    downstream_event: Optional[QuoteMessage] = None


class ExecutionOrderRequest(BaseModel):
    due_date: date
    quantity: int = Field(..., gt=0)
    side: Literal["BUY", "SELL"]
    strike: Decimal = Field(..., gt=0)
    right: Literal["CALL", "PUT", "C", "P"]
    limit_price: Decimal = Field(..., gt=0)
    slippage: Decimal = Field(default=Decimal("0"), ge=0)
    ladder_layers: int = Field(default=1, gt=0)
    strike_step: Decimal = Field(default=Decimal("0.0025"), gt=0)
    expiry_count: int = Field(default=2, gt=0)
    account: Optional[str] = None
    client_order_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def to_domain(self) -> SyncHedgeRequest:
        side_value = self.side.upper()
        try:
            side = OrderSide(side_value)
        except ValueError as exc:  # pragma: no cover - guarded by Pydantic but kept for safety
            raise ValueError("side must be BUY or SELL") from exc

        right_value = self.right.upper()
        if right_value in {"CALL", "C"}:
            option_right = OptionRight.CALL
        elif right_value in {"PUT", "P"}:
            option_right = OptionRight.PUT
        else:  # pragma: no cover - validated via Literal but defensive
            raise ValueError("right must be CALL/C or PUT/P")

        return SyncHedgeRequest(
            due_date=self.due_date,
            quantity=self.quantity,
            side=side,
            strike=float(self.strike),
            right=option_right,
            limit_price=float(self.limit_price),
            slippage=float(self.slippage),
            ladder_layers=self.ladder_layers,
            strike_step=float(self.strike_step),
            expiry_count=self.expiry_count,
            account=self.account,
            client_order_id=self.client_order_id,
            metadata=self.metadata,
        )


class ExecutionOrderResponse(BaseModel):
    contract_month: date
    strike: float
    right: str
    quantity: int
    side: str
    limit_price: float
    status: str
    ib_order_id: Optional[int]
    client_order_id: Optional[str]
    account: Optional[str]
    submitted_at: Optional[datetime]
    acknowledged_at: Optional[datetime]
    fills: List[Dict[str, Any]]

    @classmethod
    def from_domain(cls, order: HedgeOrder) -> "ExecutionOrderResponse":
        return cls(
            contract_month=order.contract_month,
            strike=order.strike,
            right=order.right.value,
            quantity=order.quantity,
            side=order.side.value,
            limit_price=order.limit_price,
            status=order.status,
            ib_order_id=order.ib_order_id,
            client_order_id=order.client_order_id,
            account=order.account,
            submitted_at=order.submitted_at,
            acknowledged_at=order.acknowledged_at,
            fills=order.fills,
        )


class HedgePlacedPayload(BaseModel):
    timestamp: datetime
    side: str
    quantity: int
    ladder_layers: int

    @classmethod
    def from_event(cls, event: HedgePlacedEvent) -> "HedgePlacedPayload":
        return cls(
            timestamp=event.timestamp,
            side=event.request.side.value,
            quantity=event.request.quantity,
            ladder_layers=event.request.ladder_layers,
        )


class ExecutionResponse(BaseModel):
    orders: List[ExecutionOrderResponse]
    hedge_event: Optional[HedgePlacedPayload] = None


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
        pricing_engine=BlackScholesPricingEngine(),
        quote_repository=repo,
        message_bus=bus,
        clock=UTCClock(),
    )
    result = orchestrator.handle_exposure_created(exposure)
    if result.quote:
        repo.save(result.quote)
    return result, bus.events


def create_app(settings: GatewaySettings | None = None) -> FastAPI:
    app = FastAPI(title="FX Option Gateway")

    gateway_settings = settings or get_settings()

    execution_root = gateway_settings.storage_dir or DEFAULT_EXECUTION_ROOT
    execution_root.mkdir(parents=True, exist_ok=True)
    execution_emitter = InMemoryEventEmitter()
    execution_storage = OrderStorage(execution_root)
    execution_service = SyncExecutionService(
        ib_config=IBKRConfig(),
        storage=execution_storage,
        emitter=execution_emitter,
        ib_client=DryRunIBKRClient() if gateway_settings.dry_run else None,
    )

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
            pricing_model="black_scholes",
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

    @app.post("/api/execution/orders", response_model=ExecutionResponse, status_code=201)
    def execution_orders(request: ExecutionOrderRequest) -> ExecutionResponse:
        try:
            hedge_request = request.to_domain()
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        previous_events = len(execution_emitter.events)
        result = execution_service.place_hedge(hedge_request)
        new_event = None
        events = execution_emitter.events[previous_events:]
        if events:
            new_event = HedgePlacedPayload.from_event(events[-1])

        orders = [ExecutionOrderResponse.from_domain(order) for order in result.orders]
        return ExecutionResponse(orders=orders, hedge_event=new_event)

    return app


app = create_app()
