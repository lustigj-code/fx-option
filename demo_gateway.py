"""Minimal gateway runner for demo without database."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import sys

from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Setup paths
PRICING_SRC = Path(__file__).resolve().parents[1] / "services" / "pricing-orchestrator" / "src"
if PRICING_SRC.exists() and str(PRICING_SRC) not in sys.path:
    sys.path.append(str(PRICING_SRC))

# Create minimal app for demo
app = FastAPI(
    title="FX Option Gateway",
    description="Production-ready API gateway for FX option pricing, risk management, and execution",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Health endpoints
@app.get("/health", tags=["Health"])
def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "gateway",
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": "demo",
        "message": "Gateway is running! Full functionality requires PostgreSQL and Redis."
    }

@app.get("/readiness", tags=["Health"])
def readiness_check():
    """Readiness check for kubernetes/load balancers."""
    return {
        "status": "ready",
        "dry_run": True,
        "execution_service": "demo-mode",
        "pricing_engine": "black_scholes",
        "database": "not-connected",
        "redis": "not-connected",
        "message": "Demo mode - database connections not available in this environment"
    }

@app.get("/", tags=["Info"])
def root():
    """Root endpoint with information."""
    return {
        "service": "FX Option Gateway",
        "version": "0.1.0",
        "status": "running",
        "documentation": "/docs",
        "health": "/health",
        "features": {
            "authentication": "JWT with RBAC (requires database)",
            "quote_generation": "Black-Scholes pricing",
            "risk_management": "Weekly netting and VaR calculations",
            "execution": "IBKR integration (dry-run mode)",
            "monitoring": "Prometheus metrics",
            "security": "CORS, security headers, rate limiting"
        },
        "endpoints": {
            "auth": [
                "POST /api/auth/register",
                "POST /api/auth/login",
                "GET /api/auth/me"
            ],
            "business": [
                "POST /api/quotes/binding",
                "POST /api/risk/plan",
                "POST /api/execution/orders"
            ],
            "monitoring": [
                "GET /health",
                "GET /readiness",
                "GET /metrics"
            ]
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
