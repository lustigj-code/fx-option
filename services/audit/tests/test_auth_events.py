import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:  # pragma: no cover - test import guard
    sys.path.insert(0, str(ROOT))

from services.audit.db import AuditLogRepository

# These imports will be satisfied when the auth event pipeline is implemented (T030).
from services.audit.auth_events import AuthEventLogger  # type: ignore  # noqa: E402


@pytest.fixture()
def audit_repo() -> AuditLogRepository:
    connection = sqlite3.connect(':memory:')
    return AuditLogRepository(connection)


def _load_payload(repo: AuditLogRepository) -> dict:
    chain = repo.all_records()
    records = list(chain)
    assert len(records) == 1
    chain.verify()
    payload = json.loads(records[0].payload_json)
    return payload


def test_login_success_event_persists_session_context(audit_repo: AuditLogRepository) -> None:
    logger = AuthEventLogger(audit_repo)
    ts = datetime(2025, 1, 1, 13, 0, tzinfo=timezone.utc)

    logger.login_success(
        user_id='user-123',
        email='demo@fxportal.local',
        roles=['treasury_manager', 'risk_analyst'],
        ip_address='203.0.113.10',
        user_agent='Jest/1.0',
        metadata={'sessionId': 'sess-abc'},
        occurred_at=ts,
    )

    payload = _load_payload(audit_repo)

    assert payload['eventType'] == 'LOGIN_SUCCESS'
    assert payload['userId'] == 'user-123'
    assert payload['email'] == 'demo@fxportal.local'
    assert payload['roles'] == ['treasury_manager', 'risk_analyst']
    assert payload['ip'] == '203.0.113.10'
    assert payload['userAgent'] == 'Jest/1.0'
    assert payload['metadata']['sessionId'] == 'sess-abc'
    assert payload['timestamp'] == ts.isoformat()


def test_login_failure_event_captures_reason_and_attempt_metadata(audit_repo: AuditLogRepository) -> None:
    logger = AuthEventLogger(audit_repo)

    logger.login_failure(
        user_id='user-404',
        email='unknown@fxportal.local',
        ip_address='198.51.100.50',
        user_agent='Jest/1.0',
        failure_reason='INVALID_PASSWORD',
        metadata={'attempt': 3},
    )

    payload = _load_payload(audit_repo)

    assert payload['eventType'] == 'LOGIN_FAILURE'
    assert payload['metadata']['attempt'] == 3
    assert payload['metadata']['failureReason'] == 'INVALID_PASSWORD'
    assert payload['ip'] == '198.51.100.50'
    assert payload['userAgent'] == 'Jest/1.0'


def test_access_denied_event_includes_route_context(audit_repo: AuditLogRepository) -> None:
    logger = AuthEventLogger(audit_repo)

    logger.access_denied(
        user_id='user-200',
        roles=['treasury_manager'],
        route='/admin/audit',
        ip_address='192.0.2.23',
        user_agent='Playwright/2.0',
        metadata={'requiredRoles': ['compliance_officer']},
    )

    payload = _load_payload(audit_repo)

    assert payload['eventType'] == 'ACCESS_DENIED'
    assert payload['metadata']['route'] == '/admin/audit'
    assert payload['metadata']['requiredRoles'] == ['compliance_officer']
    assert payload['roles'] == ['treasury_manager']
