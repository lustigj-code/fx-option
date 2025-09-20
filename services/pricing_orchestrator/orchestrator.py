"""Quote orchestration logic."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional

from .pricing_engine import BlackScholesPricingEngine, PricingEngine


@dataclass(frozen=True)
class QuoteRequest:
    """Input parameters required to price an option."""

    spot: float
    strike: float
    volatility: float
    rate: float
    time_to_expiry: float
    option_type: str = "call"


@dataclass(frozen=True)
class QuoteResponse:
    """Response returned by the orchestrator."""

    price: float
    pricing_model: Dict[str, Any]


class QuoteOrchestrator:
    """Coordinates the pricing of FX option quotes."""

    def __init__(self, pricing_engine: Optional[PricingEngine] = None) -> None:
        self._pricing_engine = pricing_engine or BlackScholesPricingEngine()

    @property
    def pricing_engine(self) -> PricingEngine:
        return self._pricing_engine

    def generate_quote(self, request: QuoteRequest) -> QuoteResponse:
        price = self._pricing_engine.price(
            spot=request.spot,
            strike=request.strike,
            volatility=request.volatility,
            rate=request.rate,
            time_to_expiry=request.time_to_expiry,
            option_type=request.option_type,
        )
        return QuoteResponse(price=price, pricing_model=self._pricing_engine.metadata())

    def generate_quote_from_payload(self, payload: Dict[str, Any]) -> QuoteResponse:
        request = QuoteRequest(**payload)
        return self.generate_quote(request)
