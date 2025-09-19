"""Event system abstraction for the execution service."""
from __future__ import annotations

from abc import ABC, abstractmethod

from .models import HedgePlacedEvent


class EventEmitter(ABC):
    """Simple interface used by the service to emit domain events."""

    @abstractmethod
    def emit(self, event: HedgePlacedEvent) -> None:
        """Emit the given event."""


class InMemoryEventEmitter(EventEmitter):
    """Utility emitter storing events in memory (useful for tests)."""

    def __init__(self) -> None:
        self.events: list[HedgePlacedEvent] = []

    def emit(self, event: HedgePlacedEvent) -> None:  # pragma: no cover - trivial
        self.events.append(event)
