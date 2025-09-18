"""Exposure event emitter."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any, Dict

logger = logging.getLogger(__name__)


@dataclass
class ExposureEvent:
    invoice_id: str
    amount: float
    currency: str
    due_date: str
    counterparty: str
    metadata: Dict[str, Any]


class ExposureEmitter:
    """Publish exposure events to the internal event bus.

    The default implementation simply logs the payload. Replace with the
    appropriate message bus producer in production.
    """

    def __init__(self, topic: str) -> None:
        self.topic = topic

    async def emit(self, event: ExposureEvent) -> None:
        payload = {
            "type": "ExposureCreated",
            "topic": self.topic,
            "invoice_id": event.invoice_id,
            "amount": event.amount,
            "currency": event.currency,
            "due_date": event.due_date,
            "counterparty": event.counterparty,
            "metadata": event.metadata,
        }
        logger.info("Emitting exposure event: %s", json.dumps(payload, sort_keys=True))


__all__ = ["ExposureEmitter", "ExposureEvent"]
