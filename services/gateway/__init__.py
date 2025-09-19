"""FastAPI gateway that orchestrates pricing, risk, and execution services."""

from .app import create_app

__all__ = ["create_app"]
