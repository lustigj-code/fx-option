from __future__ import annotations

import json
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import Mapping

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.market_data.app import MarketDataApp, Response, ServiceState
from services.market_data.providers.banxico_fix import (
    BanxicoFixClient,
    BanxicoFixError,
    BanxicoFixQuote,
)


class StubBanxicoClient(BanxicoFixClient):
    def __init__(self, quote: BanxicoFixQuote) -> None:
        super().__init__(token="dummy", cache_ttl=timedelta(minutes=5))
        self._quote = quote
        self.invocations = 0
        self.should_fail = False

    def _fetch_latest_fix(self) -> BanxicoFixQuote:  # type: ignore[override]
        if self.should_fail:
            raise BanxicoFixError("boom")
        self.invocations += 1
        return self._quote


def build_app(quote: BanxicoFixQuote) -> MarketDataApp:
    state = ServiceState()
    state.banxico_client = StubBanxicoClient(quote)  # type: ignore[assignment]
    return MarketDataApp(state=state)


def get_json(response: Response) -> Mapping[str, object]:
    status_line, headers, payload = response.to_wsgi()
    assert status_line.startswith(str(response.status))
    return json.loads(payload.decode("utf-8"))


@pytest.fixture
def app() -> MarketDataApp:
    quote = BanxicoFixQuote(value=17.25, ts=datetime(2024, 4, 5, tzinfo=timezone.utc))
    return build_app(quote)


def test_spot_returns_manual_override(app: MarketDataApp) -> None:
    override_ts = datetime(2024, 4, 6, 17, 30, tzinfo=timezone.utc)
    app.state.manual_spot_store.set_fix("USDMXN", 18.12, ts=override_ts)

    response = app.handle_request("GET", "/fx/spot", {"pair": "usdmxn"})
    assert response.status == 200
    payload = get_json(response)
    assert payload["value"] == pytest.approx(18.12)
    assert payload["source"] == "manual"
    assert payload["ts"].endswith("Z")


def test_spot_fetches_from_banxico_when_no_manual(app: MarketDataApp) -> None:
    response = app.handle_request("GET", "/fx/spot", {"pair": "USDMXN"})
    assert response.status == 200
    payload = get_json(response)
    assert payload["value"] == pytest.approx(17.25)
    assert payload["source"] == "banxico_fix"


def test_spot_bad_pair_returns_error(app: MarketDataApp) -> None:
    response = app.handle_request("GET", "/fx/spot", {"pair": "EURUSD"})
    assert response.status == 400


def test_manual_iv_lookup(app: MarketDataApp) -> None:
    ts = datetime(2024, 4, 5, 12, 0, tzinfo=timezone.utc)
    app.state.manual_iv_store.set_sigma("USDMXN", "3M", 0.1325, ts=ts)

    response = app.handle_request("GET", "/iv/atm", {"pair": "usdmxn", "tenor": "3m"})
    assert response.status == 200
    payload = get_json(response)
    assert payload["sigma"] == pytest.approx(0.1325)
    assert payload["source"] == "manual"


def test_missing_iv_returns_404(app: MarketDataApp) -> None:
    response = app.handle_request("GET", "/iv/atm", {"pair": "USDMXN", "tenor": "1M"})
    assert response.status == 404


def test_banxico_client_caches_responses() -> None:
    quote = BanxicoFixQuote(value=17.0, ts=datetime(2024, 1, 1, tzinfo=timezone.utc))
    client = StubBanxicoClient(quote)

    first = client.get_latest_fix("USDMXN")
    second = client.get_latest_fix("USDMXN")

    assert first is second
    assert client.invocations == 1


def test_banxico_client_returns_cached_on_failure() -> None:
    quote = BanxicoFixQuote(value=17.0, ts=datetime(2024, 1, 1, tzinfo=timezone.utc))
    client = StubBanxicoClient(quote)
    client.get_latest_fix("USDMXN")
    client.should_fail = True
    cached = client.get_latest_fix("USDMXN")
    assert cached.value == quote.value
