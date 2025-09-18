"""Market data service exposing FX spot and ATM IV feeds."""
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, Mapping, Optional, Tuple
from urllib.parse import parse_qs

from .providers.banxico_fix import BanxicoFixClient, BanxicoFixError, BanxicoFixQuote
from .providers.manual_iv_store import ManualIVEntry, ManualIVStore
from .providers.manual_spot_store import ManualSpotEntry, ManualSpotStore


@dataclass
class Response:
    status: int
    body: Dict[str, object]
    headers: Tuple[Tuple[str, str], ...] = (("Content-Type", "application/json"),)

    def to_wsgi(self) -> Tuple[str, list[Tuple[str, str]], bytes]:
        payload = json.dumps(self.body).encode("utf-8")
        status_line = f"{self.status} {HTTP_STATUS_TEXT.get(self.status, 'OK')}"
        headers = list(self.headers) + [("Content-Length", str(len(payload)))]
        return status_line, headers, payload


HTTP_STATUS_TEXT = {
    200: "OK",
    400: "Bad Request",
    404: "Not Found",
    405: "Method Not Allowed",
    503: "Service Unavailable",
}


def _to_iso(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


class ServiceState:
    """Container holding shared dependencies for the service."""

    def __init__(self) -> None:
        token = os.getenv("BANXICO_TOKEN")
        self.banxico_client = BanxicoFixClient(token=token)
        self.manual_spot_store = ManualSpotStore()
        self.manual_iv_store = ManualIVStore()


class MarketDataApp:
    """Minimal WSGI-compatible application for market data endpoints."""

    def __init__(self, state: Optional[ServiceState] = None) -> None:
        self.state = state or ServiceState()

    def __call__(self, environ, start_response):  # pragma: no cover - WSGI adapter
        method = environ.get("REQUEST_METHOD", "GET").upper()
        path = environ.get("PATH_INFO", "")
        query_params = parse_qs(environ.get("QUERY_STRING", ""))
        flat_query = {key: values[-1] for key, values in query_params.items() if values}
        response = self.handle_request(method, path, flat_query)
        status_line, headers, payload = response.to_wsgi()
        start_response(status_line, headers)
        return [payload]

    def handle_request(
        self, method: str, path: str, query: Mapping[str, str]
    ) -> Response:
        if method != "GET":
            return Response(status=405, body={"detail": "Method not allowed"})

        if path == "/fx/spot":
            return self._handle_spot(query)
        if path == "/iv/atm":
            return self._handle_iv(query)

        return Response(status=404, body={"detail": "Not found"})

    def _handle_spot(self, query: Mapping[str, str]) -> Response:
        pair = query.get("pair")
        if not pair:
            return Response(status=400, body={"detail": "pair parameter is required"})

        pair = pair.upper()
        manual_entry = self.state.manual_spot_store.get_fix(pair)
        if manual_entry:
            return Response(
                status=200,
                body=self._serialize_spot(manual_entry, "manual"),
            )

        try:
            fix = self.state.banxico_client.get_latest_fix(pair)
        except ValueError as exc:
            return Response(status=400, body={"detail": str(exc)})
        except BanxicoFixError as exc:
            return Response(status=503, body={"detail": str(exc)})

        return Response(status=200, body=self._serialize_spot(fix, "banxico_fix"))

    def _handle_iv(self, query: Mapping[str, str]) -> Response:
        pair = query.get("pair")
        tenor = query.get("tenor")
        if not pair or not tenor:
            return Response(
                status=400,
                body={"detail": "pair and tenor parameters are required"},
            )

        pair = pair.upper()
        tenor = tenor.upper()
        manual_entry = self.state.manual_iv_store.get_sigma(pair, tenor)
        if manual_entry:
            return Response(status=200, body=self._serialize_iv(manual_entry, "manual"))

        return Response(status=404, body={"detail": "No implied volatility available"})

    def _serialize_spot(
        self, entry: ManualSpotEntry | Dict[str, object] | BanxicoFixQuote, source: str
    ) -> Dict[str, object]:
        if isinstance(entry, ManualSpotEntry):
            payload = entry.as_dict()
        elif isinstance(entry, BanxicoFixQuote):
            payload = entry.as_dict()
        else:
            payload = dict(entry)
        return {
            "value": payload["value"],
            "ts": _to_iso(payload["ts"]),
            "source": source,
        }

    def _serialize_iv(
        self, entry: ManualIVEntry | Dict[str, object], source: str
    ) -> Dict[str, object]:
        if isinstance(entry, ManualIVEntry):
            payload = entry.as_dict()
        else:
            payload = dict(entry)
        return {
            "sigma": payload["sigma"],
            "ts": _to_iso(payload["ts"]),
            "source": source,
        }


app = MarketDataApp()
__all__ = ["app", "MarketDataApp", "ServiceState"]
