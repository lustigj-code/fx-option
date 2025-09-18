"""FastAPI application exposing the QBO connector."""

from __future__ import annotations

import logging
from typing import Dict

from fastapi import FastAPI

from .config import Settings
from .qbo_client import QBOClient
from .oauth import QBOOAuthClient
from .webhook import router as webhook_router

logger = logging.getLogger(__name__)

app = FastAPI(title="QBO Connector")
app.include_router(webhook_router, prefix="/qbo")


@app.on_event("startup")
async def startup() -> None:
    settings = Settings.get()
    oauth = QBOOAuthClient(settings)
    client = QBOClient(settings, oauth)
    try:
        await client.ensure_webhook_subscription("https://example.com/qbo/webhook")
    except Exception:  # pylint: disable=broad-except
        logger.warning("Webhook subscription validation failed", exc_info=True)


@app.get("/health")
async def healthcheck() -> Dict[str, str]:
    return {"status": "ok"}


__all__ = ["app"]
