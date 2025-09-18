"""Domain events emitted by the execution service."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Protocol

from .orders import HedgeOrder


@dataclass(slots=True)
class HedgePlaced:
    order: HedgeOrder
    occurred_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class EventEmitter(Protocol):
    def emit(self, event: HedgePlaced) -> None:  # pragma: no cover - protocol
        ...


class InMemoryEventEmitter:
    """Simple emitter storing events for inspection/testing."""

    def __init__(self) -> None:
        self.events: list[HedgePlaced] = []

    def emit(self, event: HedgePlaced) -> None:
        self.events.append(event)
