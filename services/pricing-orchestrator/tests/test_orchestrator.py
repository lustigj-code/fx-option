"""Tests for the pricing orchestrator."""

from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict

import pytest

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from services.pricing_orchestrator import (  # noqa: E402  pylint: disable=wrong-import-position
    QuoteOrchestrator,
    QuoteRequest,
    bind_quote_endpoint,
)


@dataclass
class DummyEngine:
    quoted_value: float
    metadata_payload: Dict[str, str]

    def price(
        self,
        *,
        spot: float,
        strike: float,
        volatility: float,
        rate: float,
        time_to_expiry: float,
        option_type: str = "call",
    ) -> float:
        self.last_price_args = {
            "spot": spot,
            "strike": strike,
            "volatility": volatility,
            "rate": rate,
            "time_to_expiry": time_to_expiry,
            "option_type": option_type,
        }
        return self.quoted_value

    def metadata(self) -> Dict[str, str]:
        return self.metadata_payload


def test_orchestrator_uses_injected_engine() -> None:
    engine = DummyEngine(quoted_value=42.0, metadata_payload={"name": "dummy"})
    orchestrator = QuoteOrchestrator(pricing_engine=engine)
    request = QuoteRequest(
        spot=101.0,
        strike=100.0,
        volatility=0.2,
        rate=0.01,
        time_to_expiry=0.5,
        option_type="call",
    )

    response = orchestrator.generate_quote(request)

    assert response.price == pytest.approx(42.0)
    assert response.pricing_model == engine.metadata_payload
    assert engine.last_price_args["spot"] == pytest.approx(101.0)


def test_black_scholes_engine_matches_reference_value() -> None:
    orchestrator = QuoteOrchestrator()
    request = QuoteRequest(
        spot=100.0,
        strike=100.0,
        volatility=0.2,
        rate=0.05,
        time_to_expiry=1.0,
        option_type="call",
    )

    response = orchestrator.generate_quote(request)

    reference_price = 10.4506
    assert response.price == pytest.approx(reference_price, rel=1e-3)
    assert response.pricing_model["name"] == "Black-Scholes"


def test_gateway_includes_pricing_metadata() -> None:
    engine = DummyEngine(
        quoted_value=12.5,
        metadata_payload={"name": "dummy", "version": "test"},
    )
    orchestrator = QuoteOrchestrator(pricing_engine=engine)
    endpoint = bind_quote_endpoint(orchestrator)

    payload = {
        "spot": 100.0,
        "strike": 90.0,
        "volatility": 0.3,
        "rate": 0.01,
        "time_to_expiry": 0.25,
    }

    response = endpoint(payload)

    assert response["price"] == pytest.approx(12.5)
    assert response["pricingModel"] == engine.metadata_payload
