import json
import sqlite3
from datetime import datetime, timezone

import pytest

from services.audit.db import AuditLogRepository
from services.audit.events import auth


def _repo() -> AuditLogRepository:
    conn = sqlite3.connect(':memory:')
    conn.row_factory = sqlite3.Row
    return AuditLogRepository(conn)


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='microseconds')


@pytest.mark.parametrize(
    'roles,mfa_verified',
    [
        (['treasury_manager'], True),
        (['compliance_officer', 'admin'], False),
    ],
)
def test_login_success_event_records_claims(roles, mfa_verified):
    repo = _repo()
    auth.log_login_success(
        repo=repo,
        actor='user-123',
        email='demo@fxportal.local',
        roles=roles,
        session_id='session-abc',
        mfa_verified=mfa_verified,
        ip_address='203.0.113.10',
        user_agent='pytest-client/1.0',
        issued_at=_iso_now(),
    )

    chain = repo.all_records()
    chain.verify()
    records = list(chain)
    assert len(records) == 1

    record = records[0]
    assert record.action == 'AUTH_LOGIN_SUCCESS'
    assert record.actor == 'user-123'
    payload = json.loads(record.payload_json)

    assert payload['eventType'] == 'LOGIN_SUCCESS'
    assert payload['user']['email'] == 'demo@fxportal.local'
    assert payload['user']['roles'] == roles
    assert payload['session']['id'] == 'session-abc'
    assert payload['session']['mfaVerified'] is mfa_verified
    assert payload['context']['ip'] == '203.0.113.10'
    assert payload['context']['userAgent'] == 'pytest-client/1.0'


def test_login_failure_includes_reason_and_preserves_chain():
    repo = _repo()
    auth.log_login_success(
        repo=repo,
        actor='user-123',
        email='demo@fxportal.local',
        roles=['treasury_manager'],
        session_id='session-abc',
        mfa_verified=True,
        ip_address='203.0.113.10',
        user_agent='pytest-client/1.0',
        issued_at=_iso_now(),
    )

    auth.log_login_failure(
        repo=repo,
        actor='user-123',
        email='demo@fxportal.local',
        reason='INVALID_CREDENTIALS',
        ip_address='203.0.113.10',
        user_agent='pytest-client/1.0',
        occurred_at=_iso_now(),
    )

    chain = repo.all_records()
    chain.verify()
    records = list(chain)
    assert len(records) == 2
    first, second = records

    assert second.prev_hash == first.this_hash

    payload = json.loads(second.payload_json)
    assert payload['eventType'] == 'LOGIN_FAILURE'
    assert payload['reason'] == 'INVALID_CREDENTIALS'
    assert payload['context']['ip'] == '203.0.113.10'


def test_access_denied_event_captures_route_and_required_roles():
    repo = _repo()
    auth.log_access_denied(
        repo=repo,
        actor='user-456',
        email='analyst@fxportal.local',
        attempted_path='/admin/audit',
        required_roles=['admin'],
        ip_address='198.51.100.24',
        user_agent='pytest-client/1.0',
        occurred_at=_iso_now(),
    )

    chain = repo.all_records()
    records = list(chain)
    assert len(records) == 1

    record = records[0]
    assert record.action == 'AUTH_ACCESS_DENIED'

    payload = json.loads(record.payload_json)
    assert payload['eventType'] == 'ACCESS_DENIED'
    assert payload['route'] == '/admin/audit'
    assert payload['requiredRoles'] == ['admin']
    assert payload['context']['ip'] == '198.51.100.24'
