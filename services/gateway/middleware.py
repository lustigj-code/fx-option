"""Security and monitoring middleware for the gateway."""
from __future__ import annotations

import time
from typing import Callable

from fastapi import Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from prometheus_client import Counter, Histogram
from starlette.middleware.base import BaseHTTPMiddleware

# Prometheus metrics
REQUEST_COUNT = Counter(
    "gateway_http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)

REQUEST_DURATION = Histogram(
    "gateway_http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
)

ACTIVE_REQUESTS = Counter("gateway_active_requests", "Number of active requests")


class PrometheusMiddleware(BaseHTTPMiddleware):
    """Middleware to collect Prometheus metrics."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Track request metrics."""
        start_time = time.time()

        # Track active requests
        ACTIVE_REQUESTS.inc()

        try:
            response = await call_next(request)

            # Record metrics
            duration = time.time() - start_time
            REQUEST_COUNT.labels(method=request.method, endpoint=request.url.path, status=response.status_code).inc()

            REQUEST_DURATION.labels(method=request.method, endpoint=request.url.path).observe(duration)

            # Add custom headers
            response.headers["X-Process-Time"] = str(duration)

            return response
        finally:
            ACTIVE_REQUESTS.dec()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add security headers to response."""
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        return response


def setup_cors(app, allowed_origins: list[str] | None = None):
    """Configure CORS middleware."""
    origins = allowed_origins or [
        "http://localhost:3000",  # Portal
        "http://localhost:3001",  # Admin
        "http://localhost:6006",  # Storybook
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
        expose_headers=["X-Process-Time", "X-Request-ID"],
    )


def setup_trusted_hosts(app, allowed_hosts: list[str] | None = None):
    """Configure trusted host middleware."""
    hosts = allowed_hosts or ["localhost", "127.0.0.1", "*.fxoption.com"]

    app.add_middleware(TrustedHostMiddleware, allowed_hosts=hosts)
