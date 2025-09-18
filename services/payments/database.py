"""SQLite helpers for the payments service."""
from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from .config import get_settings


def _ensure_directory(path: Path) -> None:
    if not path.parent.exists():
        path.parent.mkdir(parents=True, exist_ok=True)


def _get_connection() -> sqlite3.Connection:
    settings = get_settings()
    db_path = Path(settings.database_path)
    _ensure_directory(db_path)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def db_transaction() -> Iterator[sqlite3.Connection]:
    conn = _get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def initialize_schema() -> None:
    with db_transaction() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY,
                provider TEXT NOT NULL,
                amount TEXT NOT NULL,
                currency TEXT NOT NULL,
                status TEXT NOT NULL,
                customer_meta TEXT,
                checkout_link TEXT,
                bank_debit_intent TEXT,
                idempotency_key TEXT UNIQUE,
                external_reference TEXT UNIQUE,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS beneficiaries (
                id TEXT PRIMARY KEY,
                currency TEXT NOT NULL,
                meta TEXT NOT NULL,
                idempotency_key TEXT UNIQUE,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS payouts (
                id TEXT PRIMARY KEY,
                amount TEXT NOT NULL,
                currency TEXT NOT NULL,
                status TEXT NOT NULL,
                beneficiary_id TEXT NOT NULL,
                idempotency_key TEXT UNIQUE,
                external_reference TEXT UNIQUE,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS fee_breakdown (
                id TEXT PRIMARY KEY,
                payment_id TEXT NOT NULL,
                description TEXT NOT NULL,
                amount TEXT NOT NULL,
                FOREIGN KEY (payment_id) REFERENCES payments(id)
            )
            """
        )


initialize_schema()


__all__ = ["db_transaction", "initialize_schema"]
