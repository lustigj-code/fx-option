"""SQLite backed audit log repository."""
from __future__ import annotations

from datetime import datetime, timezone
import json
import sqlite3

from .chain import AuditChain, AuditRecord

SCHEMA = """
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    prev_hash TEXT NOT NULL,
    this_hash TEXT NOT NULL
);
"""


def ensure_schema(conn: sqlite3.Connection) -> None:
    """Ensure the audit_log table exists."""
    conn.execute(SCHEMA)
    conn.commit()


class AuditLogRepository:
    """Repository providing append-only access to the audit log."""

    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn
        ensure_schema(self._conn)

    def append(self, actor: str, action: str, payload: object, ts: datetime | None = None) -> AuditRecord:
        """Append a new audit entry."""
        timestamp = self._canonical_timestamp(ts)
        payload_json = self._canonical_payload(payload)
        prev_hash = self._previous_hash()
        this_hash = AuditChain.compute_hash(prev_hash, timestamp, actor, action, payload_json)
        cursor = self._conn.execute(
            """
            INSERT INTO audit_log (ts, actor, action, payload_json, prev_hash, this_hash)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (timestamp, actor, action, payload_json, prev_hash, this_hash),
        )
        self._conn.commit()
        rowid = cursor.lastrowid
        return AuditRecord(rowid, timestamp, actor, action, payload_json, prev_hash, this_hash)

    def all_records(self) -> AuditChain:
        """Return all audit records ordered by id."""
        cursor = self._conn.execute(
            "SELECT id, ts, actor, action, payload_json, prev_hash, this_hash FROM audit_log ORDER BY id"
        )
        rows = cursor.fetchall()
        return AuditChain.from_rows(rows)

    def verify(self) -> None:
        """Verify the integrity of the stored chain."""
        chain = self.all_records()
        chain.verify()

    def _previous_hash(self) -> str:
        row = self._conn.execute("SELECT this_hash FROM audit_log ORDER BY id DESC LIMIT 1").fetchone()
        if row is None:
            return AuditChain.GENESIS_HASH
        return row[0]

    @staticmethod
    def _canonical_timestamp(ts: datetime | None) -> str:
        if ts is None:
            ts = datetime.now(timezone.utc)
        if ts.tzinfo is None:
            raise ValueError("timestamp must be timezone aware")
        return ts.astimezone(timezone.utc).isoformat(timespec="microseconds")

    @staticmethod
    def _canonical_payload(payload: object) -> str:
        if payload is None:
            return "null"
        if isinstance(payload, str):
            parsed = json.loads(payload)
        else:
            parsed = payload
        return json.dumps(parsed, sort_keys=True, separators=(",", ":"))


__all__ = ["AuditLogRepository", "ensure_schema", "SCHEMA"]
