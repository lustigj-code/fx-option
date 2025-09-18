"""Manual implied volatility storage provider."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock
from typing import Dict, Optional, Tuple


@dataclass(frozen=True)
class ManualIVEntry:
    """Container for a manually curated implied volatility quote."""

    sigma: float
    ts: datetime

    def as_dict(self) -> Dict[str, object]:
        return {"sigma": self.sigma, "ts": self.ts}


class ManualIVStore:
    """Simple in-memory key-value store for ATM implied vols.

    The store is thread-safe and intended for use as an escape hatch when the
    authoritative CME settlement data is not available. Quotes are keyed by the
    currency pair and tenor.
    """

    def __init__(self) -> None:
        self._lock = Lock()
        self._entries: Dict[Tuple[str, str], ManualIVEntry] = {}

    def set_sigma(
        self, pair: str, tenor: str, sigma: float, *, ts: Optional[datetime] = None
    ) -> None:
        """Insert or update the manual sigma for the requested pair/tenor."""

        if sigma <= 0:
            raise ValueError("sigma must be positive")

        key = (pair.upper(), tenor.upper())
        timestamp = ts or datetime.now(tz=timezone.utc)
        with self._lock:
            self._entries[key] = ManualIVEntry(sigma=sigma, ts=timestamp)

    def get_sigma(self, pair: str, tenor: str) -> Optional[ManualIVEntry]:
        """Return the stored manual sigma if present."""

        key = (pair.upper(), tenor.upper())
        with self._lock:
            return self._entries.get(key)

    def clear(self) -> None:
        """Remove every manual entry from the store."""

        with self._lock:
            self._entries.clear()
