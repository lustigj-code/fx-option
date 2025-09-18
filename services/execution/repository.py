"""Persistence helpers for orders and fills."""
from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from typing import Iterable

from .orders import HedgeFill, HedgeOrder


class JsonLineRepository:
    """Append-only JSON-lines persistence for domain objects."""

    def __init__(self, path: Path) -> None:
        self._path = path
        if not self._path.parent.exists():
            self._path.parent.mkdir(parents=True, exist_ok=True)
        if not self._path.exists():
            self._path.touch()

    def append(self, item: HedgeOrder | HedgeFill) -> None:
        payload = asdict(item)
        if isinstance(item, HedgeOrder):
            payload["placed_at"] = item.placed_at.isoformat()
        else:
            payload["occurred_at"] = item.occurred_at.isoformat()
        with self._path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(payload) + "\n")

    def read(self) -> Iterable[dict]:
        if not self._path.exists():
            return []
        with self._path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                raw = json.loads(line)
                for key in ("placed_at", "occurred_at"):
                    if key in raw:
                        raw[key] = datetime.fromisoformat(raw[key])
                yield raw
