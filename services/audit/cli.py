"""CLI tool to verify audit log integrity."""
from __future__ import annotations

import argparse
import sqlite3
import sys

from .chain import ChainIntegrityError
from .db import AuditLogRepository


def main(argv: list[str] | None = None) -> int:
    """Entry point for the audit_verify command."""
    parser = argparse.ArgumentParser(description="Verify the tamper-evident audit log chain")
    parser.add_argument("database", help="Path to the SQLite database file containing audit_log")
    args = parser.parse_args(argv)

    conn = sqlite3.connect(args.database)
    try:
        repository = AuditLogRepository(conn)
        repository.verify()
        count = conn.execute("SELECT COUNT(*) FROM audit_log").fetchone()[0]
        print(f"audit log ok: {count} entries verified")
        return 0
    except ChainIntegrityError as exc:
        print(f"audit log verification failed: {exc}", file=sys.stderr)
        return 1
    finally:
        conn.close()


if __name__ == "__main__":  # pragma: no cover - CLI passthrough
    sys.exit(main())
