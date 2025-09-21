"""Placeholder auth event logging module (implemented in later tasks)."""

from __future__ import annotations

from datetime import datetime

from services.audit.db import AuditLogRepository


def log_login_success(
    repo: AuditLogRepository,
    *,
    actor: str,
    email: str,
    roles: list[str],
    session_id: str,
    mfa_verified: bool,
    ip_address: str,
    user_agent: str,
    issued_at: str | datetime,
) -> None:  # pragma: no cover - placeholder
    raise NotImplementedError


def log_login_failure(
    repo: AuditLogRepository,
    *,
    actor: str,
    email: str,
    reason: str,
    ip_address: str,
    user_agent: str,
    occurred_at: str | datetime,
) -> None:  # pragma: no cover - placeholder
    raise NotImplementedError


def log_access_denied(
    repo: AuditLogRepository,
    *,
    actor: str,
    email: str,
    attempted_path: str,
    required_roles: list[str],
    ip_address: str,
    user_agent: str,
    occurred_at: str | datetime,
) -> None:  # pragma: no cover - placeholder
    raise NotImplementedError
