"""Pydantic schemas for the gateway service."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field, validator


class MarketDataPayload(BaseModel):
    spot: Decimal = Field(..., gt=0)
    implied_volatility: Decimal = Field(..., ge=0)
    interest_rate: Decimal


class BindingQuoteRequest(BaseModel):
    id: str
    currency_pair: str = Field(..., min_length=3)
    notional: Decimal = Field(..., gt=0)
    strike: Decimal = Field(..., gt=0)
    tenor_days: int = Field(..., gt=0)
    market_data: MarketDataPayload

    def to_domain(self):
        from pricing_orchestrator.domain import ExposureCreated, MarketDataSnapshot

        exposure = ExposureCreated(
            exposure_id=self.id,
            currency_pair=self.currency_pair,
            notional=self.notional,
            strike=self.strike,
            tenor_days=self.tenor_days,
        )
        snapshot = MarketDataSnapshot(
            spot=self.market_data.spot,
            implied_volatility=self.market_data.implied_volatility,
            interest_rate=self.market_data.interest_rate,
        )
        return exposure, snapshot


class QuoteMessage(BaseModel):
    exposure_id: str
    price: Decimal
    valid_until: datetime


class BindingQuoteResponse(BaseModel):
    exposure_id: str
    price: Decimal
    pricing_model: str
    valid_until: datetime
    implied_volatility: Decimal
    cap: Decimal
    safety_buffer_seconds: int
    latency_ms: float
    downstream_event: Optional[QuoteMessage] = None


class QuoteInput(BaseModel):
    pair: str
    spot: float
    volatility: float

    @validator('pair')
    def normalise_pair(cls, value: str) -> str:
        return value.replace('/', '').upper()


class PositionInput(BaseModel):
    pair: str
    expiry: date
    side: str
    delta: float
    k_distribution: Optional[dict[str, float]] = None

    @validator('pair')
    def normalise_pair(cls, value: str) -> str:
        return value.replace('/', '').upper()

    @validator('side')
    def normalise_side(cls, value: str) -> str:
        return value.lower()


class RiskPlanRequest(BaseModel):
    quotes: List[QuoteInput]
    exposures: List[PositionInput]
    hedges: List[PositionInput] = Field(default_factory=list)


class RiskBucket(BaseModel):
    pair: str
    week_start: date
    week_end: date
    pre_delta: float
    post_delta: float
    pre_var: float
    post_var: float
    distribution: dict[str, float]
    delta_reduction_pct: float
    var_reduction_pct: float
    average_tenor_days: int


class NettingSavings(BaseModel):
    delta: float
    var: float
    delta_pct: float
    var_pct: float


class RiskPlanResponse(BaseModel):
    buckets: List[RiskBucket]
    execution_plan: List[dict]
    netting_savings: NettingSavings


class ExecutionOrderRequest(BaseModel):
    due_date: date
    quantity: int = Field(..., gt=0)
    side: str
    strike: Decimal = Field(..., gt=0)
    right: str
    limit_price: Decimal = Field(..., gt=0)
    slippage: Decimal = Field(default=Decimal('0'), ge=0)
    ladder_layers: int = Field(default=1, gt=0)
    strike_step: Decimal = Field(default=Decimal('0.0025'), gt=0)
    expiry_count: int = Field(default=2, gt=0)
    account: Optional[str] = None
    client_order_id: Optional[str] = None
    metadata: dict = Field(default_factory=dict)
    dry_run: bool = True

    @validator('side')
    def normalise_side(cls, value: str) -> str:
        upper = value.upper()
        if upper not in {'BUY', 'SELL'}:
            raise ValueError('side must be BUY or SELL')
        return upper

    @validator('right')
    def normalise_right(cls, value: str) -> str:
        upper = value.upper()
        if upper not in {'CALL', 'PUT', 'C', 'P'}:
            raise ValueError('right must be CALL/C or PUT/P')
        return 'CALL' if upper in {'CALL', 'C'} else 'PUT'

    def to_domain(self):
        from services.execution_sync.models import HedgeRequest as SyncHedgeRequest, OptionRight, OrderSide

        side = OrderSide(self.side)
        right = OptionRight.CALL if self.right == 'CALL' else OptionRight.PUT
        return SyncHedgeRequest(
            due_date=self.due_date,
            quantity=self.quantity,
            side=side,
            strike=float(self.strike),
            right=right,
            limit_price=float(self.limit_price),
            slippage=float(self.slippage),
            ladder_layers=self.ladder_layers,
            strike_step=float(self.strike_step),
            expiry_count=self.expiry_count,
            account=self.account,
            client_order_id=self.client_order_id,
            metadata=self.metadata,
        )


class ExecutionOrderItem(BaseModel):
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
    fills: list


class HedgePlaced(BaseModel):
    timestamp: datetime
    side: str
    quantity: int
    ladder_layers: int


class ExecutionResponse(BaseModel):
    orders: List[ExecutionOrderItem]
    hedge_event: Optional[HedgePlaced] = None


__all__ = [
    'BindingQuoteRequest',
    'BindingQuoteResponse',
    'ExecutionOrderRequest',
    'ExecutionResponse',
    'RiskPlanRequest',
    'RiskPlanResponse',
]
