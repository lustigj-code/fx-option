"""HTTP helpers for the Siigo connector."""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Dict, Optional
from urllib import error, request


@dataclass
class HttpResponse:
    status_code: int
    body: Dict[str, object]


class SimpleHttpClient:
    """Minimal HTTP client for interacting with Siigo."""

    def __init__(self, timeout: int = 30):
        self.timeout = timeout

    def post_json(
        self,
        url: str,
        payload: Dict[str, object],
        headers: Optional[Dict[str, str]] = None,
    ) -> HttpResponse:
        data = json.dumps(payload).encode("utf-8")
        req = request.Request(url, data=data, method="POST")
        req.add_header("Content-Type", "application/json")
        for key, value in (headers or {}).items():
            req.add_header(key, value)

        try:
            with request.urlopen(req, timeout=self.timeout) as response:
                body = response.read().decode("utf-8") or "{}"
                parsed = json.loads(body)
                return HttpResponse(status_code=response.getcode(), body=parsed)
        except error.HTTPError as exc:  # pragma: no cover - defensive
            payload = exc.read().decode("utf-8") or "{}"
            try:
                parsed = json.loads(payload)
            except json.JSONDecodeError:
                parsed = {"error": payload}
            return HttpResponse(status_code=exc.code, body=parsed)


DEFAULT_HTTP_CLIENT = SimpleHttpClient()
