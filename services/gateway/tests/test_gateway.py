from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.gateway import app as gateway_app  # noqa: E402
from services.gateway.app import ExecutionService, GatewayApp  # noqa: E402


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> GatewayApp:
    service = ExecutionService(storage_dir=tmp_path)
    test_app = GatewayApp(execution_service=service)
    monkeypatch.setattr(gateway_app, "app", test_app)
    monkeypatch.setattr(gateway_app, "execution_service", service)
    return test_app


def test_successful_order_placement_returns_laddered_orders(client: GatewayApp, tmp_path: Path) -> None:
    payload = {
        "strategy_id": "alpha",
        "instrument": "EURUSD",
        "side": "BUY",
        "notional": 1_000_000,
        "base_price": 1.1,
        "levels": 3,
        "price_increment": 0.0005,
    }

    response = client.handle("POST", "/api/execution/orders", payload)

    assert response.status_code == 200
    body = response.json()

    assert body["status"] == "submitted"
    assert len(body["orders"]) == payload["levels"]

    expected_prices = [round(payload["base_price"] + i * payload["price_increment"], 6) for i in range(payload["levels"])]
    returned_prices = [order["limit_price"] for order in body["orders"]]
    assert returned_prices == expected_prices

    expected_quantity = round(payload["notional"] / payload["levels"] / payload["base_price"], 6)
    assert {order["quantity"] for order in body["orders"]} == {expected_quantity}

    files = list(tmp_path.iterdir())
    assert len(files) == 1
    assert files[0].suffix == ".json"


def test_validation_errors_for_bad_payload(client: GatewayApp) -> None:
    response = client.handle(
        "POST",
        "/api/execution/orders",
        {
            "strategy_id": "alpha",
            "instrument": "EURUSD",
            "side": "hold",
            "notional": -100,
            "base_price": 0,
            "levels": 0,
            "price_increment": -0.1,
        },
    )

    assert response.status_code == 422
    assert "detail" in response.json()
