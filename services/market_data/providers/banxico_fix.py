"""Banxico FIX provider."""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)


class BanxicoFixError(RuntimeError):
    """Raised when the Banxico FIX quote cannot be retrieved."""


@dataclass(frozen=True)
class BanxicoFixQuote:
    value: float
    ts: datetime

    def as_dict(self) -> Dict[str, object]:
        return {"value": self.value, "ts": self.ts}


class BanxicoFixClient:
    """Client responsible for fetching FIX data from Banxico."""

    SERIES_ID = "SF43718"  # Daily USD/MXN FIX

    def __init__(
        self,
        *,
        token: Optional[str],
        cache_ttl: timedelta = timedelta(minutes=5),
        min_request_interval: timedelta = timedelta(seconds=30),
    ) -> None:
        self._token = token
        self._cache_ttl = cache_ttl
        self._min_request_interval = min_request_interval
        self._cached_quote: Optional[BanxicoFixQuote] = None
        self._cache_expiry: Optional[datetime] = None
        self._last_request_at: Optional[datetime] = None

    def get_latest_fix(self, pair: str) -> BanxicoFixQuote:
        if pair.upper() != "USDMXN":
            raise ValueError("Banxico FIX only supports the USDMXN pair")

        now = datetime.now(tz=timezone.utc)
        if self._cached_quote and self._cache_expiry and now < self._cache_expiry:
            return self._cached_quote

        if (
            self._last_request_at
            and now - self._last_request_at < self._min_request_interval
            and self._cached_quote
        ):
            logger.debug("Returning cached Banxico FIX due to rate-limit guard")
            return self._cached_quote

        try:
            quote = self._fetch_latest_fix()
        except Exception as exc:  # pragma: no cover - defensive
            if self._cached_quote:
                logger.warning("Falling back to cached Banxico FIX: %s", exc)
                return self._cached_quote
            raise BanxicoFixError("Unable to fetch Banxico FIX") from exc

        self._cached_quote = quote
        self._cache_expiry = now + self._cache_ttl
        self._last_request_at = now
        return quote

    def _fetch_latest_fix(self) -> BanxicoFixQuote:
        if not self._token:
            raise BanxicoFixError("BANXICO token is not configured")

        base_url = (
            "https://www.banxico.org.mx/SieAPIRest/service/v1/series/"
            f"{self.SERIES_ID}/datos/oportuno"
        )
        params = urlencode({"token": self._token})
        url = f"{base_url}?{params}"
        request = Request(url, method="GET")

        try:
            with urlopen(request, timeout=10) as response:  # nosec B310
                payload = json.load(response)
        except (HTTPError, URLError, TimeoutError) as exc:
            raise BanxicoFixError("Error reaching Banxico FIX endpoint") from exc

        series = payload.get("bmx", {}).get("series", [])
        if not series:
            raise BanxicoFixError("Malformed Banxico response: missing series")

        data_points = series[0].get("datos", [])
        if not data_points:
            raise BanxicoFixError("Banxico response missing data points")

        latest = data_points[-1]
        raw_value = latest.get("dato")
        raw_date = latest.get("fecha")
        if not raw_value or not raw_date:
            raise BanxicoFixError("Banxico response missing fix values")

        try:
            value = float(str(raw_value).replace(",", ""))
        except ValueError as exc:  # pragma: no cover - defensive
            raise BanxicoFixError("Unable to parse Banxico FIX value") from exc

        ts = datetime.strptime(raw_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        return BanxicoFixQuote(value=value, ts=ts)
