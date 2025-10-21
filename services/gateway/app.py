"""REST gateway stitching together pricing, risk, and execution primitives."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import sys
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse, PlainTextResponse
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

PRICING_SRC = Path(__file__).resolve().parents[1] / "pricing-orchestrator" / "src"
if PRICING_SRC.exists() and str(PRICING_SRC) not in sys.path:  # pragma: no cover - defensive
    sys.path.append(str(PRICING_SRC))

from pricing_orchestrator.domain import ExposureCreated, MarketDataSnapshot, Quote
from pricing_orchestrator.interfaces import Clock, MarketDataProvider, MessageBus, PricingEngine, QuoteRepository
from pricing_orchestrator.orchestrator import QuoteOrchestrator
from pricing_orchestrator.pricing_engine import BlackScholesPricingEngine

from services.execution_sync.events import InMemoryEventEmitter
from services.execution_sync.ibkr import IBKRConfig
from services.execution_sync.models import HedgeOrder, HedgePlacedEvent
from services.execution_sync.service import ExecutionService as SyncExecutionService
from services.execution_sync.storage import OrderStorage
from services.gateway.schemas import (
    BindingQuoteRequest,
    BindingQuoteResponse,
    ExecutionOrderItem,
    ExecutionOrderRequest,
    ExecutionResponse,
    HedgePlaced,
    QuoteMessage,
    RiskPlanRequest,
    RiskPlanResponse,
)
from services.gateway.settings import GatewaySettings, get_settings
from services.gateway.middleware import (
    PrometheusMiddleware,
    SecurityHeadersMiddleware,
    setup_cors,
    setup_trusted_hosts,
)
from services.risk.service import RiskService
from services.auth.router import router as auth_router
from services.auth.dependencies import get_current_active_user, require_operator
from services.database.models import User

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


class InMemoryMarketDataProvider(MarketDataProvider):
    def __init__(self, snapshots: Dict[str, MarketDataSnapshot]):
        self._snapshots = snapshots

    def fetch(self, exposure_id: str) -> MarketDataSnapshot:
        try:
            return self._snapshots[exposure_id]
        except KeyError as exc:  # pragma: no cover - defensive
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

    def publish(self, event) -> None:  # pragma: no cover - simple adapter
        self.events.append(
            QuoteMessage(
                exposure_id=event.exposure_id,
                price=event.price,
                valid_until=event.valid_until,
            )
        )


class UTCClock(Clock):
    def now(self):  # pragma: no cover - simple adapter
        return datetime.now(timezone.utc)


def create_app(settings: GatewaySettings | None = None) -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="FX Option Gateway",
        description="Production-ready API gateway for FX option pricing, risk management, and execution",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    gateway_settings = settings or get_settings()

    # Setup middleware (order matters!)
    app.add_middleware(PrometheusMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    setup_cors(app)
    setup_trusted_hosts(app)

    # Include authentication router
    app.include_router(auth_router)

    # Setup execution service
    execution_root = gateway_settings.storage_dir or DEFAULT_EXECUTION_ROOT
    execution_root.mkdir(parents=True, exist_ok=True)
    execution_emitter = InMemoryEventEmitter()
    execution_storage = OrderStorage(execution_root)
    execution_client = None if not gateway_settings.dry_run else DryRunIBKRClient()
    execution_service = SyncExecutionService(
        ib_config=IBKRConfig(),
        storage=execution_storage,
        emitter=execution_emitter,
        ib_client=execution_client,
    )

    pricing_engine: PricingEngine = BlackScholesPricingEngine()

    # ==================== Health & Monitoring ====================

    @app.get("/health", tags=["Health"])
    def health_check():
        """Basic health check endpoint.

        Returns service status. Always returns 200 if the service is running.
        Use this for basic uptime monitoring.
        """
        return {
            "status": "healthy",
            "service": "gateway",
            "version": "0.1.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    @app.get("/readiness", tags=["Health"])
    def readiness_check():
        """Readiness check for kubernetes/load balancers.

        Indicates whether the service is ready to accept traffic.
        Can be extended to check database connectivity, external service health, etc.
        """
        return {
            "status": "ready",
            "dry_run": gateway_settings.dry_run,
            "execution_service": "initialized",
            "pricing_engine": "black_scholes",
        }

    @app.get("/metrics", tags=["Monitoring"])
    def metrics():
        """Prometheus metrics endpoint.

        Exposes application metrics in Prometheus format.
        Scrape this endpoint with Prometheus to collect:
        - HTTP request counts and durations
        - Active request counts
        - Custom business metrics
        """
        return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    # ==================== Quote Generation ====================

    @app.post("/api/quotes/binding", response_model=BindingQuoteResponse, tags=["Quotes"])
    def binding_quote(
        payload: BindingQuoteRequest,
        current_user: User = Depends(get_current_active_user),
    ) -> BindingQuoteResponse:
        """Generate a binding quote for an FX option exposure.

        Uses Black-Scholes pricing model with market data inputs to generate
        a time-limited binding quote. The quote is valid for 2 minutes minus
        a safety buffer.

        **Authentication**: Required (all authenticated users)

        **Rate Limit**: 200ms P99 SLA enforced

        **Returns**:
        - Binding quote with price, validity window, and market parameters
        - Downstream event for quote publication
        """
        exposure, snapshot = payload.to_domain()
        provider = InMemoryMarketDataProvider({exposure.exposure_id: snapshot})
        repository = InMemoryQuoteRepository()
        bus = InMemoryBus()

        orchestrator = QuoteOrchestrator(
            market_data_provider=provider,
            pricing_engine=pricing_engine,
            quote_repository=repository,
            message_bus=bus,
            clock=UTCClock(),
        )

        result = orchestrator.handle_exposure_created(exposure)
        if not result.succeeded():
            raise HTTPException(status_code=400, detail=result.error or "quote generation failed")

        assert result.quote is not None  # for mypy
        downstream = bus.events[0] if bus.events else None
        return BindingQuoteResponse(
            exposure_id=result.quote.exposure_id,
            price=result.quote.price,
            pricing_model="black_scholes",
            valid_until=result.quote.valid_until,
            implied_volatility=result.quote.implied_volatility,
            cap=result.quote.cap,
            safety_buffer_seconds=result.quote.safety_buffer_seconds,
            latency_ms=result.latency_ms,
            downstream_event=downstream,
        )

    # ==================== Risk Management ====================

    @app.post("/api/risk/plan", response_model=RiskPlanResponse, tags=["Risk"])
    def risk_plan(
        request: RiskPlanRequest,
        current_user: User = Depends(require_operator),
    ) -> RiskPlanResponse:
        """Generate risk plan with weekly netting buckets and execution recommendations.

        Analyzes exposures, existing hedges, and quotes to:
        - Group positions by currency pair and weekly expiry
        - Calculate pre/post-hedge delta and VaR
        - Compute netting savings from offsetting positions
        - Generate optimal execution plan

        **Authentication**: Required (operator or admin role)

        **Returns**:
        - Weekly risk buckets with delta/VaR calculations
        - Execution plan for residual positions
        - Netting savings analysis
        """
        service = RiskService(quotes=[quote.model_dump() for quote in request.quotes])
        plan = service.generate_plan(
            [exposure.model_dump() for exposure in request.exposures],
            [hedge.model_dump() for hedge in request.hedges],
        )

        buckets = [bucket for bucket in plan.get("buckets", [])]
        return RiskPlanResponse(
            buckets=buckets,
            execution_plan=plan.get("execution_plan", []),
            netting_savings=plan.get("netting_savings", {}),
        )

    # ==================== Execution ====================

    @app.post("/api/execution/orders", response_model=ExecutionResponse, status_code=201, tags=["Execution"])
    def execution_orders(
        request: ExecutionOrderRequest,
        current_user: User = Depends(require_operator),
    ) -> ExecutionResponse:
        """Submit laddered hedge orders for execution via IBKR.

        Constructs a ladder of option orders across multiple expiries and strikes,
        allocates quantity, and submits to Interactive Brokers for execution.

        **Authentication**: Required (operator or admin role)

        **Dry-run mode**: Enabled by default. Set GATEWAY_DRY_RUN=false for production.

        **Returns**:
        - List of submitted orders with IBKR order IDs
        - Order status and fill information
        - Hedge placement event
        """
        try:
            hedge_request = request.to_domain()
        except ValueError as exc:  # pragma: no cover - defensive
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        previous_events = len(execution_emitter.events)
        result = execution_service.place_hedge(hedge_request)

        new_event = None
        events = execution_emitter.events[previous_events:]
        if events:
            new_event = HedgePlaced(
                timestamp=events[-1].timestamp,
                side=events[-1].request.side.value,
                quantity=events[-1].request.quantity,
                ladder_layers=events[-1].request.ladder_layers,
            )

        orders = [
            ExecutionOrderItem(
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
            for order in result.orders
        ]

        return ExecutionResponse(orders=orders, hedge_event=new_event)

    return app


app = create_app()
