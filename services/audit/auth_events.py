"""Audit event helpers for authentication flows."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable, Mapping, MutableMapping

from .db import AuditLogRepository


AuthMetadata = Mapping[str, object] | None


def _coerce_timestamp(value: datetime | None) -> datetime:
    if value is None:
        return datetime.now(timezone.utc)
    if value.tzinfo is None:
        raise ValueError("timestamp must be timezone aware")
    return value.astimezone(timezone.utc)


def _normalize_roles(roles: Iterable[str] | None) -> list[str]:
    if not roles:
        return []
    return [str(role) for role in roles]


def _merge_metadata(base: AuthMetadata, *, route: str | None = None, failure_reason: str | None = None, source: str | None = None) -> MutableMapping[str, object]:
    merged: MutableMapping[str, object] = dict(base or {})
    if route:
        merged.setdefault("route", route)
    if failure_reason:
        merged.setdefault("failureReason", failure_reason)
    if source:
        merged.setdefault("source", source)
    return merged


@dataclass(frozen=True)
class AuthEventLogger:
    """High-level helper that appends auth-related events to the audit repository."""

    repository: AuditLogRepository
    source: str = "auth-service"

    def login_success(
        self,
        *,
        user_id: str,
        email: str | None,
        roles: Iterable[str] | None,
        ip_address: str | None,
        user_agent: str | None,
        metadata: AuthMetadata = None,
        occurred_at: datetime | None = None,
    ) -> None:
        timestamp = _coerce_timestamp(occurred_at)
        payload = {
            "eventType": "LOGIN_SUCCESS",
            "userId": user_id,
            "email": email,
            "roles": _normalize_roles(roles),
            "ip": ip_address,
            "userAgent": user_agent,
            "metadata": _merge_metadata(metadata, source=self.source),
            "timestamp": timestamp.isoformat(),
        }
        self.repository.append(user_id or "anonymous", "LOGIN_SUCCESS", payload, ts=timestamp)

    def login_failure(
        self,
        *,
        user_id: str,
        email: str | None,
        ip_address: str | None,
        user_agent: str | None,
        failure_reason: str,
        metadata: AuthMetadata = None,
        occurred_at: datetime | None = None,
    ) -> None:
        timestamp = _coerce_timestamp(occurred_at)
        payload = {
            "eventType": "LOGIN_FAILURE",
            "userId": user_id,
            "email": email,
            "roles": [],
            "ip": ip_address,
            "userAgent": user_agent,
            "metadata": _merge_metadata(metadata, failure_reason=failure_reason, source=self.source),
            "timestamp": timestamp.isoformat(),
        }
        self.repository.append(user_id or "anonymous", "LOGIN_FAILURE", payload, ts=timestamp)

    def logout(
        self,
        *,
        user_id: str,
        email: str | None,
        roles: Iterable[str] | None,
        ip_address: str | None,
        user_agent: str | None,
        metadata: AuthMetadata = None,
        occurred_at: datetime | None = None,
    ) -> None:
        timestamp = _coerce_timestamp(occurred_at)
        payload = {
            "eventType": "LOGOUT",
            "userId": user_id,
            "email": email,
            "roles": _normalize_roles(roles),
            "ip": ip_address,
            "userAgent": user_agent,
            "metadata": _merge_metadata(metadata, source=self.source),
            "timestamp": timestamp.isoformat(),
        }
        self.repository.append(user_id or "anonymous", "LOGOUT", payload, ts=timestamp)

    def access_denied(
        self,
        *,
        user_id: str,
        roles: Iterable[str] | None,
        route: str,
        ip_address: str | None,
        user_agent: str | None,
        metadata: AuthMetadata = None,
        occurred_at: datetime | None = None,
    ) -> None:
        timestamp = _coerce_timestamp(occurred_at)
        payload = {
            "eventType": "ACCESS_DENIED",
            "userId": user_id,
            "email": None,
            "roles": _normalize_roles(roles),
            "ip": ip_address,
            "userAgent": user_agent,
            "metadata": _merge_metadata(metadata, route=route, source=self.source),
            "timestamp": timestamp.isoformat(),
        }
        self.repository.append(user_id or "anonymous", "ACCESS_DENIED", payload, ts=timestamp)


__all__ = ["AuthEventLogger"]
