"""FastAPI application exposing audit ingestion and retrieval endpoints."""
from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterator, Literal

from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from .auth_events import AuthEventLogger
from .db import AuditLogRepository


AuditEventType = Literal['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'ACCESS_DENIED']


@dataclass(frozen=True)
class AuditSettings:
    database_path: Path
    source: str = 'audit-webhook'


def resolve_settings() -> AuditSettings:
    db_path = Path(os.getenv('AUDIT_DB_PATH', 'data/audit.db')).resolve()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    source = os.getenv('AUDIT_EVENT_SOURCE', 'audit-webhook')
    return AuditSettings(database_path=db_path, source=source)


@contextmanager
def repository_context(settings: AuditSettings) -> Iterator[AuditLogRepository]:
    connection = sqlite3.connect(settings.database_path)
    try:
        yield AuditLogRepository(connection)
    finally:
        connection.close()


class AuthEventIn(BaseModel):
    eventType: AuditEventType
    userId: str = Field(..., alias='userId')
    email: str | None = Field(default=None)
    roles: list[str] = Field(default_factory=list)
    ip: str | None = Field(default=None)
    userAgent: str | None = Field(default=None, alias='userAgent')
    metadata: dict[str, object] = Field(default_factory=dict)
    timestamp: datetime | None = Field(default=None)

    @field_validator('timestamp', mode='before')
    @classmethod
    def parse_timestamp(cls, value: object) -> datetime | None:
        if value is None or value == '':
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            return datetime.fromisoformat(value)
        raise ValueError('timestamp must be ISO formatted string or datetime')


class AuthEventOut(BaseModel):
    id: str
    eventType: AuditEventType
    userId: str
    roles: list[str]
    ip: str | None
    userAgent: str | None
    metadata: dict[str, object]
    timestamp: str


def create_app(settings: AuditSettings | None = None) -> FastAPI:
    config = settings or resolve_settings()
    app = FastAPI(title='FX Option Audit Service')

    def get_repository() -> Iterator[AuditLogRepository]:
        with repository_context(config) as repo:
            yield repo

    def get_logger(repo: AuditLogRepository = Depends(get_repository)) -> Iterator[AuthEventLogger]:
        yield AuthEventLogger(repo, source=config.source)

    @app.post('/events/auth', status_code=status.HTTP_202_ACCEPTED)
    def ingest_auth_event(event: AuthEventIn, logger: AuthEventLogger = Depends(get_logger)) -> dict[str, str]:
        timestamp = event.timestamp
        if event.eventType == 'LOGIN_SUCCESS':
            logger.login_success(
                user_id=event.userId,
                email=event.email,
                roles=event.roles,
                ip_address=event.ip,
                user_agent=event.userAgent,
                metadata=event.metadata,
                occurred_at=timestamp,
            )
        elif event.eventType == 'LOGIN_FAILURE':
            reason = str(event.metadata.get('failureReason') or 'UNKNOWN')
            logger.login_failure(
                user_id=event.userId,
                email=event.email,
                ip_address=event.ip,
                user_agent=event.userAgent,
                failure_reason=reason,
                metadata=event.metadata,
                occurred_at=timestamp,
            )
        elif event.eventType == 'LOGOUT':
            logger.logout(
                user_id=event.userId,
                email=event.email,
                roles=event.roles,
                ip_address=event.ip,
                user_agent=event.userAgent,
                metadata=event.metadata,
                occurred_at=timestamp,
            )
        else:  # ACCESS_DENIED
            route = str(event.metadata.get('route') or 'unknown')
            logger.access_denied(
                user_id=event.userId,
                roles=event.roles,
                route=route,
                ip_address=event.ip,
                user_agent=event.userAgent,
                metadata=event.metadata,
                occurred_at=timestamp,
            )

        return {'status': 'accepted'}

    @app.get('/events/auth', response_model=list[AuthEventOut])
    def list_auth_events(limit: int = 100, repo: AuditLogRepository = Depends(get_repository)) -> list[AuthEventOut]:
        if limit <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='limit must be positive')

        records = list(repo.all_records())
        response: list[AuthEventOut] = []
        for record in reversed(records[-limit:]):
            payload = json.loads(record.payload_json)
            response.append(
                AuthEventOut(
                    id=str(record.id),
                    eventType=payload.get('eventType', 'ACCESS_DENIED'),
                    userId=payload.get('userId', record.actor),
                    roles=[str(role) for role in payload.get('roles', [])],
                    ip=payload.get('ip'),
                    userAgent=payload.get('userAgent'),
                    metadata=payload.get('metadata') or {},
                    timestamp=payload.get('timestamp', record.ts),
                )
            )
        return response

    return app


app = create_app()
