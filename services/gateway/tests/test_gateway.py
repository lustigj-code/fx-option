from __future__ import annotations

from decimal import Decimal

from fastapi.testclient import TestClient

from services.gateway.app import create_app


client = TestClient(create_app())


def test_binding_quote_endpoint_generates_quote():
    payload = {
        "id": "exp-1",
        "currency_pair": "USD/MXN",
        "notional": "1000000",
        "strike": "17.55",
        "tenor_days": 30,
        "market_data": {
            "spot": "17.42",
            "implied_volatility": "0.18",
            "interest_rate": "0.045"
        }
    }

    response = client.post("/api/quotes/binding", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()
    quote = data["quote"]
    assert quote["exposure_id"] == "exp-1"
    assert Decimal(quote["price"]) > Decimal("0")
    assert "valid_until" in quote


def test_risk_plan_endpoint_returns_plan():
    payload = {
        "quotes": [
            {"pair": "USD/MXN", "spot": 17.4, "volatility": 0.12}
        ],
        "exposures": [
            {
                "pair": "USD/MXN",
                "expiry": "2024-12-31",
                "side": "buy",
                "delta": 1_000_000,
                "k_distribution": {"ATM": 1.0}
            }
        ],
        "hedges": []
    }

    response = client.post("/api/risk/plan", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()
    assert "execution_plan" in data
    assert isinstance(data["execution_plan"], list)
