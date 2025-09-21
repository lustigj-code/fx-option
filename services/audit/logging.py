"""Logging utilities for forwarding structured records into the audit log."""

from __future__ import annotations

import json
import logging
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .db import AuditLogRepository


@dataclass
class AuditLogHandlerConfig:
    """Configuration for the audit log handler."""

    db_path: Path
    actor: str = 'gateway'


class AuditLogHandler(logging.Handler):
    """Logging handler that persists log records into the audit repository."""

    def __init__(self, db_path: str | Path, actor: str = 'gateway') -> None:
        super().__init__()
        self._config = AuditLogHandlerConfig(db_path=Path(db_path), actor=actor)

    def emit(self, record: logging.LogRecord) -> None:  # pragma: no cover - exercised via tests
        try:
            payload = self._extract_payload(record)
            action = getattr(record, 'audit_action', 'log_record')
            actor = getattr(record, 'audit_actor', self._config.actor)
            timestamp = datetime.fromtimestamp(record.created, tz=timezone.utc)

            self._config.db_path.parent.mkdir(parents=True, exist_ok=True)
            connection = sqlite3.connect(self._config.db_path)
            try:
                repository = AuditLogRepository(connection)
                repository.append(actor=actor, action=action, payload=payload, ts=timestamp)
            finally:
                connection.close()
        except Exception:  # pragma: no cover - defensive, errors routed to logging framework
            self.handleError(record)

    def _extract_payload(self, record: logging.LogRecord) -> Any:
        explicit = getattr(record, 'audit_payload', None)
        if explicit is not None:
            return self._ensure_serializable(explicit)

        message = record.getMessage()
        try:
            parsed = json.loads(message)
        except json.JSONDecodeError:
            return {
                'message': message,
                'logger': record.name,
                'level': record.levelname,
            }
        return parsed

    @staticmethod
    def _ensure_serializable(value: Any) -> Any:
        if isinstance(value, (str, int, float, bool)) or value is None:
            return value
        if isinstance(value, dict):
            return {key: AuditLogHandler._ensure_serializable(val) for key, val in value.items()}
        if isinstance(value, (list, tuple, set)):
            return [AuditLogHandler._ensure_serializable(item) for item in value]
        try:
            json.dumps(value)
            return value
        except TypeError:
            return repr(value)


__all__ = ['AuditLogHandler', 'AuditLogHandlerConfig']
