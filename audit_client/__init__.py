"""Client helper for writing audit log events."""
from __future__ import annotations

from datetime import datetime
import sqlite3

from services.audit.db import AuditLogRepository
from services.audit.chain import AuditRecord


class AuditClient:
    """High level client for appending entries to the audit log."""

    def __init__(self, database_path: str):
        self._database_path = database_path

    @property
    def database_path(self) -> str:
        return self._database_path

    def log(self, actor: str, action: str, payload: object, ts: datetime | None = None) -> AuditRecord:
        with sqlite3.connect(self._database_path) as conn:
            repository = AuditLogRepository(conn)
            return repository.append(actor, action, payload, ts=ts)

    def iter_records(self) -> list[AuditRecord]:
        with sqlite3.connect(self._database_path) as conn:
            repository = AuditLogRepository(conn)
            chain = repository.all_records()
            return list(chain)


__all__ = ["AuditClient", "AuditRecord"]
