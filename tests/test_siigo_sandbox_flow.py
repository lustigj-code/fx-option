"""End-to-end sandbox flow for the Siigo connector."""
from __future__ import annotations

import json
import threading
import time
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Dict, Tuple

from services.connectors.siigo.config import SiigoEnvironment
from services.connectors.siigo.subscription import SiigoCredentials, SiigoWebhookSubscription


class _SandboxState:
    def __init__(self):
        self.auth_payload: Dict[str, object] | None = None
        self.subscription_payload: Dict[str, object] | None = None
        self.authorization_header: str | None = None


class _SandboxHandler(BaseHTTPRequestHandler):
    state = _SandboxState()

    def _json_response(self, payload: Dict[str, object], status: int = 200) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):  # noqa: N802 - required by BaseHTTPRequestHandler
        if self.path == "/auth":
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length)) if length else {}
            self.state.auth_payload = payload
            if payload.get("username") == "sandbox" and payload.get("access_key") == "sandbox-key":
                self._json_response({"access_token": "sandbox-token"})
            else:
                self._json_response({"error": "invalid-credentials"}, status=401)
        elif self.path == "/v1/webhooks/subscriptions":
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length)) if length else {}
            self.state.subscription_payload = payload
            self.state.authorization_header = self.headers.get("Authorization")
            if self.state.authorization_header != "Bearer sandbox-token":
                self._json_response({"error": "missing-token"}, status=401)
                return
            payload["id"] = "subscription-123"
            self._json_response(payload)
        else:
            self._json_response({"error": "not-found"}, status=404)

    def log_message(self, format: str, *args):  # pragma: no cover - silence server logs
        return


def _start_server() -> Tuple[HTTPServer, threading.Thread]:
    server = HTTPServer(("127.0.0.1", 0), _SandboxHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    # Allow the server to initialize the socket before requests come in.
    time.sleep(0.1)
    return server, thread


class SiigoSandboxFlowTest(unittest.TestCase):
    def test_end_to_end_sandbox_flow(self):
        server, thread = _start_server()
        base_url = f"http://{server.server_address[0]}:{server.server_address[1]}"
        environment = SiigoEnvironment(name="sandbox", base_url=base_url)

        credentials = SiigoCredentials(
            username="sandbox",
            access_key="sandbox-key",
            client_id="sandbox-client",
            client_secret="sandbox-secret",
        )

        client = SiigoWebhookSubscription(credentials, environment=environment)
        subscription = client.create_subscription(
            "https://example.com/webhooks/siigo",
            ["invoices.send", "invoices.update"],
            headers={"x-signed": "secret"},
            description="Demo subscription",
        )

        try:
            self.assertEqual(subscription["id"], "subscription-123")
            self.assertEqual(_SandboxHandler.state.authorization_header, "Bearer sandbox-token")
            self.assertEqual(
                _SandboxHandler.state.subscription_payload,
                {
                    "url": "https://example.com/webhooks/siigo",
                    "active": True,
                    "event": ["invoices.send", "invoices.update"],
                    "description": "Demo subscription",
                    "headers": {"x-signed": "secret"},
                    "id": "subscription-123",
                },
            )
            self.assertEqual(
                _SandboxHandler.state.auth_payload,
                {
                    "username": "sandbox",
                    "access_key": "sandbox-key",
                    "client_id": "sandbox-client",
                    "client_secret": "sandbox-secret",
                },
            )
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=1)
