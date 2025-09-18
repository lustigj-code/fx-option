"""Simple in-memory queue abstraction for publishing domain events."""
from __future__ import annotations

import threading
from collections import deque
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Deque, Iterable, Optional

from .schemas import PaymentSettledEvent


@dataclass
class Event:
    name: str
    payload: object
    published_at: datetime


class EventQueue:
    """Thread-safe FIFO queue for domain events."""

    def __init__(self) -> None:
        self._events: Deque[Event] = deque()
        self._lock = threading.Lock()

    def publish(self, event: Event) -> None:
        with self._lock:
            self._events.append(event)

    def drain(self) -> Iterable[Event]:
        with self._lock:
            while self._events:
                yield self._events.popleft()

    def peek_latest(self) -> Optional[Event]:
        with self._lock:
            return self._events[-1] if self._events else None


event_queue = EventQueue()


def publish_payment_settled(event: PaymentSettledEvent) -> None:
    event_queue.publish(Event(name="PaymentSettled", payload=event, published_at=datetime.now(tz=UTC)))


__all__ = ["Event", "EventQueue", "event_queue", "publish_payment_settled"]
