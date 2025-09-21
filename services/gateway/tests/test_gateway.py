from __future__ import annotations

import base64
import hmac
import json
import time
from decimal import Decimal
import base64
import hmac
import json
import sys
import time
from decimal import Decimal
from hashlib import sha256
from pathlib import Path
from typing import Any, Dict, Iterable

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:  # pragma: no cover - test environment guard
    sys.path.insert(0, str(ROOT))

from services.gateway.app import create_app
from services.gateway.settings import GatewaySettings

TEST_SECRET = "test-secret"
TEST_AUDIENCE = "fx-gateway"
TEST_ISSUER = "fx-option"
SCOPE_RULES = {
    "post:/api/quotes/binding": "quotes:execute",
    "post:/api/risk/plan": "risk:review",
    "post:/api/execution/orders": "execution:write",
}


def _encode_segment(value: Dict[str, Any]) -> str:
    json_bytes = json.dumps(value, separators=(",", ":"), sort_keys=True).encode()
    return base64.urlsafe_b64encode(json_bytes).rstrip(b"=").decode()


def _encode_jwt(payload: Dict[str, Any], secret: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_segment = _encode_segment(header)
    payload_segment = _encode_segment(payload)
    signing_input = f"{header_segment}.{payload_segment}".encode()
    signature = hmac.new(secret.encode(), signing_input, sha256).digest()
    signature_segment = base64.urlsafe_b64encode(signature).rstrip(b"=").decode()
    return f"{header_segment}.{payload_segment}.{signature_segment}"


def build_token(scopes: Iterable[str], *, secret: str = TEST_SECRET, extra_claims: Dict[str, Any] | None = None) -> str:
    payload = {
        "sub": "demo-user",
        "aud": TEST_AUDIENCE,
        "iss": TEST_ISSUER,
        "exp": int(time.time()) + 300,
        "scope": " ".join(scopes),
    }
    if extra_claims:
        payload.update(extra_claims)
    return _encode_jwt(payload, secret)


def auth_header(*scopes: str) -> Dict[str, str]:
    token = build_token(scopes)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def client(tmp_path) -> TestClient:
    settings = GatewaySettings(
        storage_dir=tmp_path,
        dry_run=True,
        jwt_secret=TEST_SECRET,
        jwt_audience=TEST_AUDIENCE,
        jwt_issuer=TEST_ISSUER,
        scope_rules=SCOPE_RULES,
    )
    return TestClient(create_app(settings))


def test_binding_quote_endpoint_generates_quote(client: TestClient):
    payload = {
        "id": "exp-1",
        "currency_pair": "USD/MXN",
        "notional": "1000000",
        "strike": "17.55",
        "tenor_days": 30,
        "market_data": {
            "spot": "17.42",
            "implied_volatility": "0.18",
            "interest_rate": "0.045",
        },
    }

    response = client.post("/api/quotes/binding", json=payload, headers=auth_header("quotes:execute"))
    assert response.status_code == 200, response.text
    quote = response.json()
    assert quote["exposure_id"] == "exp-1"
    assert Decimal(quote["price"]) > Decimal("0")
    assert "valid_until" in quote
    assert quote["pricing_model"] == "black_scholes"


def test_risk_plan_endpoint_returns_plan(client: TestClient):
    payload = {
        "quotes": [
            {"pair": "USD/MXN", "spot": 17.4, "volatility": 0.12},
        ],
        "exposures": [
            {
                "pair": "USD/MXN",
                "expiry": "2024-12-31",
                "side": "buy",
                "delta": 1_000_000,
                "k_distribution": {"ATM": 1.0},
            }
        ],
        "hedges": [],
    }

    response = client.post("/api/risk/plan", json=payload, headers=auth_header("risk:review"))
    assert response.status_code == 200, response.text
    data = response.json()
    assert "execution_plan" in data
    assert isinstance(data["execution_plan"], list)
    assert "buckets" in data
    assert isinstance(data["buckets"], list)


def test_execution_endpoint_returns_orders(client: TestClient):
    payload = {
        "due_date": "2024-02-15",
        "quantity": 1_000_000,
        "side": "BUY",
        "strike": 17.45,
        "right": "CALL",
        "limit_price": 0.0015,
        "slippage": 0.0001,
        "ladder_layers": 2,
        "strike_step": 0.0005,
        "expiry_count": 2,
        "metadata": {"strategy": "overnight-ladder"},
    }

    response = client.post(
        "/api/execution/orders",
        json=payload,
        headers=auth_header("execution:write"),
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert len(body["orders"]) > 0
    first_order = body["orders"][0]
    assert first_order["status"] == "FILLED"
    assert first_order["side"] == "BUY"
    assert first_order["contract_month"]
    event = body.get("hedge_event")
    assert event is not None
    assert event["side"] == "BUY"


def test_rejects_missing_token(client: TestClient):
    response = client.post("/api/quotes/binding", json={})
    assert response.status_code == 401
    assert response.json()["detail"] == "Unauthorized"


def test_rejects_insufficient_scope(client: TestClient):
    token_headers = auth_header("risk:review")
    response = client.post("/api/execution/orders", json={}, headers=token_headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Forbidden"


def test_rejects_expired_token(client: TestClient):
    expired_token = build_token(["quotes:execute"], extra_claims={"exp": int(time.time()) - 5})
    response = client.post(
        "/api/quotes/binding",
        json={},
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Unauthorized"


def test_rejects_invalid_audience(client: TestClient):
    wrong_audience_token = build_token(["risk:review"], extra_claims={"aud": "other"})
    response = client.post(
        "/api/risk/plan",
        json={"quotes": [], "exposures": [], "hedges": []},
        headers={"Authorization": f"Bearer {wrong_audience_token}"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Unauthorized"


def test_rejects_invalid_signature(client: TestClient):
    token = build_token(["execution:write"], secret="not-the-secret")
    response = client.post(
        "/api/execution/orders",
        json={},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Unauthorized"
