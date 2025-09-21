from __future__ import annotations

from datetime import datetime

from datetime import date, datetime
from pathlib import Path
import sys

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from services.gateway.app import create_app
from services.gateway.schemas import BindingQuoteResponse, ExecutionResponse, RiskPlanResponse


client = TestClient(create_app())


def test_binding_quote_response_contract():
    payload = {
        "id": "exp-contract",
        "currency_pair": "USD/MXN",
        "notional": "2500000",
        "strike": "17.55",
        "tenor_days": 45,
        "market_data": {
            "spot": "17.44",
            "implied_volatility": "0.21",
            "interest_rate": "0.052",
        },
    }

    response = client.post("/api/quotes/binding", json=payload)
    assert response.status_code == 200, response.text

    body = response.json()
    parsed = BindingQuoteResponse.model_validate(body)
    assert parsed.pricing_model == "black_scholes"
    assert isinstance(parsed.valid_until, datetime)
    if parsed.downstream_event:
        assert parsed.downstream_event.exposure_id == parsed.exposure_id


def test_risk_plan_response_contract():
    payload = {
        "quotes": [
            {"pair": "USD/MXN", "spot": 17.4, "volatility": 0.2},
            {"pair": "EUR/USD", "spot": 1.08, "volatility": 0.15},
        ],
        "exposures": [
            {
                "pair": "USD/MXN",
                "expiry": "2024-12-31",
                "side": "buy",
                "delta": 1500000,
                "k_distribution": {"ATM": 0.6, "25D": 0.4},
            }
        ],
        "hedges": [],
    }

    response = client.post("/api/risk/plan", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()

    parsed = RiskPlanResponse.model_validate(body)
    assert parsed.execution_plan is not None
    assert parsed.netting_savings.delta >= 0
    for bucket in parsed.buckets:
        assert bucket.week_start <= bucket.week_end


def test_execution_response_contract():
    payload = {
        "due_date": "2024-05-05",
        "quantity": 250000,
        "side": "BUY",
        "strike": 17.4,
        "right": "CALL",
        "limit_price": 0.0012,
        "slippage": 0.0001,
        "ladder_layers": 2,
        "strike_step": 0.0005,
        "expiry_count": 2,
        "metadata": {"batch": "contract-test"},
    }

    response = client.post("/api/execution/orders", json=payload)
    assert response.status_code == 201, response.text
    body = response.json()

    parsed = ExecutionResponse.model_validate(body)
    assert parsed.orders, "expected at least one order"
    for order in parsed.orders:
        assert order.status in {"FILLED", "WORKING", "REJECTED"}
        assert isinstance(order.contract_month, date)

    if parsed.hedge_event:
        assert parsed.hedge_event.side in {"BUY", "SELL"}
        assert isinstance(parsed.hedge_event.timestamp, datetime)
