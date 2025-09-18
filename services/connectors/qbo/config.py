"""Configuration helpers for the QuickBooks Online connector."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class QBOConfig:
    """Runtime configuration for the QBO connector."""

    client_id: str
    client_secret: str
    redirect_uri: str
    realm_id: str
    environment: str = "sandbox"
    webhook_verifier_token: str = ""
    exposure_topic: str = "exposure.created"
    http_timeout: float = 2.5

    @classmethod
    def from_env(cls) -> "QBOConfig":
        """Load configuration from environment variables."""

        def require(name: str) -> str:
            value = os.getenv(name)
            if not value:
                raise RuntimeError(f"Missing required environment variable: {name}")
            return value

        return cls(
            client_id=require("QBO_CLIENT_ID"),
            client_secret=require("QBO_CLIENT_SECRET"),
            redirect_uri=require("QBO_REDIRECT_URI"),
            realm_id=require("QBO_REALM_ID"),
            environment=os.getenv("QBO_ENVIRONMENT", "sandbox"),
            webhook_verifier_token=require("QBO_WEBHOOK_VERIFIER_TOKEN"),
            exposure_topic=os.getenv("QBO_EXPOSURE_TOPIC", "exposure.created"),
            http_timeout=float(os.getenv("QBO_HTTP_TIMEOUT", "2.5")),
        )


class Settings:
    """Global settings container used to cache runtime configuration."""

    _config: Optional[QBOConfig] = None

    @classmethod
    def get(cls) -> QBOConfig:
        if cls._config is None:
            cls._config = QBOConfig.from_env()
        return cls._config


__all__ = ["QBOConfig", "Settings"]
