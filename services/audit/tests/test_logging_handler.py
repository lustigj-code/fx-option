import json
import logging
import sqlite3
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from services.audit.db import AuditLogRepository
from services.audit.logging import AuditLogHandler


@pytest.mark.parametrize(
    'payload,action',
    [
        ({'foo': 'bar'}, 'structured_event'),
        ('{"message": "hello"}', 'log_record'),
    ],
)
def test_audit_log_handler_appends_records(tmp_path: Path, payload, action):
    db_path = tmp_path / 'audit-log.sqlite'
    handler = AuditLogHandler(db_path, actor='gateway')
    logger = logging.getLogger('audit.test')
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)

    try:
        if isinstance(payload, dict):
            logger.info('structured payload', extra={'audit_payload': payload, 'audit_action': action})
        else:
            logger.info(payload)
    finally:
        logger.removeHandler(handler)
        handler.close()

    conn = sqlite3.connect(db_path)
    try:
        repository = AuditLogRepository(conn)
        records = list(repository.all_records())
    finally:
        conn.close()

    assert len(records) == 1
    record = records[0]
    assert record.actor == 'gateway'
    assert record.action == action
    body = json.loads(record.payload_json)
    if isinstance(payload, dict):
        assert body == payload
    else:
        assert body['message'] == 'hello'
        assert body['logger'] == 'audit.test'
        assert body['level'] == 'INFO'
