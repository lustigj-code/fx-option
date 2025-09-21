"""Request authentication middleware for the gateway service."""

from __future__ import annotations

import base64
import hmac
import json
import logging
import time
from hashlib import sha256
from typing import Any, Dict, Iterable, List, Optional

from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.types import ASGIApp

from services.gateway.settings import GatewaySettings


logger = logging.getLogger("gateway.auth")


def _b64_decode(segment: str) -> bytes:
    padding = "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode(segment + padding)


def _decode_jwt(token: str, secret: str) -> Dict[str, Any]:
    try:
        header_segment, payload_segment, signature_segment = token.split(".")
    except ValueError as exc:  # pragma: no cover - defensive
        raise ValueError("invalid token structure") from exc

    header_bytes = _b64_decode(header_segment)
    header = json.loads(header_bytes)
    algorithm = header.get("alg")
    if algorithm != "HS256":
        raise ValueError("unsupported jwt algorithm")

    signing_input = f"{header_segment}.{payload_segment}".encode()
    expected_signature = hmac.new(secret.encode(), signing_input, sha256).digest()
    provided_signature = _b64_decode(signature_segment)
    if not hmac.compare_digest(expected_signature, provided_signature):
        raise ValueError("jwt signature mismatch")

    payload_bytes = _b64_decode(payload_segment)
    return json.loads(payload_bytes)


class JwtAuthMiddleware(BaseHTTPMiddleware):
    """Validates bearer JWTs and enforces scope requirements."""

    def __init__(self, app: ASGIApp, settings: GatewaySettings) -> None:
        super().__init__(app)
        self._settings = settings

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        if not self._settings.jwt_secret:
            return await call_next(request)

        route_key = self._resolve_route_key(request)
        required_scope = self._settings.scope_rules.get(route_key)

        auth_header = request.headers.get("authorization")
        if not auth_header or not auth_header.lower().startswith("bearer "):
            logger.warning("missing bearer token for %s", route_key)
            return JSONResponse({"detail": "Unauthorized"}, status_code=401)

        token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = _decode_jwt(token, self._settings.jwt_secret)
        except ValueError as exc:
            logger.warning("jwt validation failed for %s: %s", route_key, exc)
            return JSONResponse({"detail": "Unauthorized"}, status_code=401)

        try:
            self._validate_claims(payload, required_scope)
        except PermissionError as exc:
            logger.warning("insufficient scope for %s: %s", route_key, exc)
            return JSONResponse({"detail": "Forbidden"}, status_code=403)
        except ValueError as exc:
            logger.warning("invalid token claims for %s: %s", route_key, exc)
            return JSONResponse({"detail": "Unauthorized"}, status_code=401)

        request.state.principal = payload
        return await call_next(request)

    def _resolve_route_key(self, request: Request) -> str:
        path = request.url.path.rstrip("/") or "/"
        method = request.method.lower()
        return f"{method}:{path}"

    def _validate_claims(self, payload: Dict[str, Any], required_scope: Optional[str]) -> None:
        exp = payload.get("exp")
        if exp is not None:
            if not isinstance(exp, (int, float)):
                raise ValueError("invalid exp claim")
            if exp < time.time():
                raise ValueError("token expired")

        audience = self._settings.jwt_audience
        if audience:
            raw_audience = payload.get("aud")
            audiences: Iterable[str]
            if isinstance(raw_audience, str):
                audiences = [raw_audience]
            elif isinstance(raw_audience, list):
                audiences = [str(item) for item in raw_audience]
            else:
                raise ValueError("invalid aud claim")
            if audience not in audiences:
                raise ValueError("audience mismatch")

        issuer = self._settings.jwt_issuer
        if issuer and payload.get("iss") != issuer:
            raise ValueError("issuer mismatch")

        if required_scope:
            scopes = self._extract_scopes(payload)
            if required_scope not in scopes:
                raise PermissionError(f"missing scope {required_scope}")

    @staticmethod
    def _extract_scopes(payload: Dict[str, Any]) -> List[str]:
        scopes: List[str] = []
        raw_scope = payload.get("scope")
        if isinstance(raw_scope, str):
            scopes.extend(segment for segment in raw_scope.split() if segment)
        raw_scopes = payload.get("scopes")
        if isinstance(raw_scopes, list):
            scopes.extend(str(value) for value in raw_scopes)
        return scopes


__all__ = ["JwtAuthMiddleware"]
