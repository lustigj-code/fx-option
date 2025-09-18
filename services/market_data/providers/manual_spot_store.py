"""Manual FX spot storage provider."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock
from typing import Dict, Optional


@dataclass(frozen=True)
class ManualSpotEntry:
    value: float
    ts: datetime

    def as_dict(self) -> Dict[str, object]:
        return {"value": self.value, "ts": self.ts}


class ManualSpotStore:
    """Thread-safe in-memory store for manually supplied FX spot fixes."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._entries: Dict[str, ManualSpotEntry] = {}

    def set_fix(self, pair: str, value: float, *, ts: Optional[datetime] = None) -> None:
        if value <= 0:
            raise ValueError("value must be positive")

        timestamp = ts or datetime.now(tz=timezone.utc)
        with self._lock:
            self._entries[pair.upper()] = ManualSpotEntry(value=value, ts=timestamp)

    def get_fix(self, pair: str) -> Optional[ManualSpotEntry]:
        with self._lock:
            return self._entries.get(pair.upper())

    def clear(self) -> None:
        with self._lock:
            self._entries.clear()
