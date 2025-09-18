"""Utility helpers for retry and idempotency handling."""
from __future__ import annotations

import hashlib
import hmac
import json
import time
from typing import Callable, Optional


def retry_with_backoff(func: Callable[[], object], attempts: int = 3, base_delay: float = 0.2) -> object:
    """Run ``func`` with exponential backoff retries."""

    last_exc: Optional[Exception] = None
    for attempt in range(1, attempts + 1):
        try:
            return func()
        except Exception as exc:  # pragma: no cover - re-raise below
            last_exc = exc
            if attempt == attempts:
                raise
            time.sleep(base_delay * (2 ** (attempt - 1)))
    if last_exc:  # pragma: no cover - defensive
        raise last_exc
    return None


def compute_signature(secret: str, payload: bytes) -> str:
    return hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()


def verify_signature(secret: str, payload: bytes, header_signature: str) -> bool:
    expected = compute_signature(secret, payload)
    return hmac.compare_digest(expected, header_signature)


def json_dumps(data: object) -> str:
    return json.dumps(data, separators=(",", ":"), sort_keys=True)


__all__ = ["retry_with_backoff", "verify_signature", "json_dumps"]
