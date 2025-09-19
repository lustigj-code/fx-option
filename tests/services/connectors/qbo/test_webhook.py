"""Tests for the QBO webhook handler."""

from __future__ import annotations

import hmac
import hashlib
import json
from typing import Any, Dict, List

import pytest
from fastapi.testclient import TestClient

from services.connectors.qbo.app import app
from services.connectors.qbo import webhook
from services.connectors.qbo.config import Settings


@pytest.fixture(autouse=True)
def setup_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("QBO_CLIENT_ID", "id")
    monkeypatch.setenv("QBO_CLIENT_SECRET", "secret")
    monkeypatch.setenv("QBO_REDIRECT_URI", "https://example.com/callback")
    monkeypatch.setenv("QBO_REALM_ID", "12345")
    monkeypatch.setenv("QBO_WEBHOOK_VERIFIER_TOKEN", "token")
    Settings.reset()


def _sign(payload: Dict[str, Any], token: str) -> str:
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    return hmac.new(token.encode(), body, hashlib.sha256).hexdigest()


class DummyEmitter:
    def __init__(self, *_: Any, **__: Any) -> None:
        self.events: List[Dict[str, Any]] = []

    async def emit(self, event: Any) -> None:  # pragma: no cover - type ignore
        self.events.append(event.__dict__)


class DummyClient:
    def __init__(self, *_: Any, **__: Any) -> None:
        self.invoice = {
            "Id": "99",
            "DueDate": "2024-04-01",
            "CurrencyRef": {"value": "EUR"},
            "TotalAmt": "120.55",
            "CustomerRef": {"name": "ACME GmbH"},
            "DocNumber": "INV-99",
            "Balance": 120.55,
        }

    async def get_invoice(self, _: str) -> Dict[str, Any]:
        return self.invoice

    async def get_company_currency(self) -> str:
        return "USD"

    async def ensure_webhook_subscription(self, *_: Any, **__: Any) -> None:
        return None


class DummyOAuth:
    def __init__(self, *_: Any, **__: Any) -> None:
        pass

    async def get_access_token(self) -> str:
        return "token"


@pytest.mark.asyncio
async def test_verify_signature() -> None:
    token = "token"
    payload = {"foo": "bar"}
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    signature = webhook._verify_signature(body, _sign(payload, token), token)
    assert signature is True


def test_webhook_emits_exposure(monkeypatch: pytest.MonkeyPatch) -> None:
    dummy_emitter = DummyEmitter()
    monkeypatch.setattr(webhook, "ExposureEmitter", lambda *_: dummy_emitter)
    monkeypatch.setattr(webhook, "QBOClient", DummyClient)
    monkeypatch.setattr(webhook, "QBOOAuthClient", DummyOAuth)
    monkeypatch.setattr("services.connectors.qbo.app.QBOClient", DummyClient)
    monkeypatch.setattr("services.connectors.qbo.app.QBOOAuthClient", DummyOAuth)

    payload = {
        "eventNotifications": [
            {
                "dataChangeEvent": {
                    "entities": [
                        {"name": "Invoice", "operation": "Create", "id": "99"}
                    ]
                }
            }
        ]
    }

    headers = {"intuit-signature": _sign(payload, "token")}

    client = TestClient(app)
    response = client.post("/qbo/webhook", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json() == {"status": "accepted"}
    assert dummy_emitter.events
    event = dummy_emitter.events[0]
    assert event["currency"] == "EUR"
    assert event["due_date"] == "2024-04-01"


def test_webhook_ignores_home_currency(monkeypatch: pytest.MonkeyPatch) -> None:
    dummy_emitter = DummyEmitter()
    monkeypatch.setattr(webhook, "ExposureEmitter", lambda *_: dummy_emitter)
    monkeypatch.setattr(webhook, "QBOClient", DummyClient)
    monkeypatch.setattr(webhook, "QBOOAuthClient", DummyOAuth)
    monkeypatch.setattr("services.connectors.qbo.app.QBOClient", DummyClient)
    monkeypatch.setattr("services.connectors.qbo.app.QBOOAuthClient", DummyOAuth)

    payload = {
        "eventNotifications": [
            {
                "dataChangeEvent": {
                    "entities": [
                        {"name": "Invoice", "operation": "Update", "id": "99"}
                    ]
                }
            }
        ]
    }

    headers = {"intuit-signature": _sign(payload, "token")}

    dummy_client = DummyClient()
    dummy_client.invoice["CurrencyRef"]["value"] = "USD"
    monkeypatch.setattr(webhook, "QBOClient", lambda *_: dummy_client)

    client = TestClient(app)
    response = client.post("/qbo/webhook", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json() == {"status": "accepted"}
    assert not dummy_emitter.events


def test_webhook_invalid_signature() -> None:
    payload = {}
    headers = {"intuit-signature": "invalid"}
    client = TestClient(app)
    response = client.post("/qbo/webhook", json=payload, headers=headers)
    assert response.status_code == 401
