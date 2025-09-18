"""Persistence helpers for execution artefacts."""
from __future__ import annotations

import json
from dataclasses import asdict
from datetime import date, datetime
from pathlib import Path
from threading import RLock
from typing import Iterable, List

from .models import HedgeOrder


class OrderStorage:
    """Thread-safe JSON persistence for orders."""

    def __init__(self, root: Path) -> None:
        self._root = root
        self._root.mkdir(parents=True, exist_ok=True)
        self._orders_path = self._root / "orders.json"
        self._fills_path = self._root / "fills.json"
        self._lock = RLock()

    def _load(self, path: Path) -> List[dict]:
        if not path.exists():
            return []
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def _normalise(self, value):
        if isinstance(value, (date, datetime)):
            return value.isoformat()
        if isinstance(value, list):
            return [self._normalise(item) for item in value]
        if isinstance(value, dict):
            return {key: self._normalise(val) for key, val in value.items()}
        return value

    def _dump(self, path: Path, records: Iterable[dict]) -> None:
        with path.open("w", encoding="utf-8") as handle:
            normalised = [self._normalise(record) for record in records]
            json.dump(normalised, handle, indent=2, sort_keys=True)

    def record_order(self, order: HedgeOrder) -> None:
        with self._lock:
            orders = self._load(self._orders_path)
            orders.append(asdict(order))
            self._dump(self._orders_path, orders)

    def record_fills(self, order: HedgeOrder) -> None:
        with self._lock:
            fills = self._load(self._fills_path)
            fills.append(
                {
                    "ib_order_id": order.ib_order_id,
                    "client_order_id": order.client_order_id,
                    "fills": order.fills,
                    "status": order.status,
                }
            )
            self._dump(self._fills_path, fills)
