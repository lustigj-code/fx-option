import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from services.audit.db import AuditLogRepository
from services.audit.logging import AuditLogHandler
from services.gateway import app as gateway_app


def test_emit_gateway_event_forwarded_to_audit(tmp_path: Path):
    db_path = tmp_path / 'gateway-audit.sqlite'

    existing_handlers = [
        handler
        for handler in gateway_app.LOGGER.handlers
        if isinstance(handler, AuditLogHandler)
    ]
    for handler in existing_handlers:
        gateway_app.LOGGER.removeHandler(handler)

    handler = AuditLogHandler(db_path, actor='gateway')
    gateway_app.LOGGER.addHandler(handler)

    try:
        gateway_app.emit_gateway_event(
            endpoint='bindingQuote',
            status='success',
            latency_ms=12.5,
            exposure_id='exp-123',
        )
    finally:
        gateway_app.LOGGER.removeHandler(handler)
        handler.close()
        for existing in existing_handlers:
            gateway_app.LOGGER.addHandler(existing)

    conn = sqlite3.connect(db_path)
    try:
        repository = AuditLogRepository(conn)
        records = list(repository.all_records())
    finally:
        conn.close()

    assert len(records) == 1
    record = records[0]
    assert record.action == 'telemetry_event'
    payload = json.loads(record.payload_json)
    assert payload['endpoint'] == 'bindingQuote'
    assert payload['status'] == 'success'
    assert payload['exposure_id'] == 'exp-123'
