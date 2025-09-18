"""Configuration helpers for the payments service without external dependencies."""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass
class Settings:
    database_path: str = os.getenv("PAYMENTS_DATABASE_PATH", "payments.db")
    stripe_webhook_secret: str = os.getenv("PAYMENTS_STRIPE_WEBHOOK_SECRET", "whsec_test")
    stripe_api_key: str = os.getenv("PAYMENTS_STRIPE_API_KEY", "sk_test")
    dlocal_webhook_secret: str = os.getenv("PAYMENTS_DLOCAL_WEBHOOK_SECRET", "whsec_dlocal")
    dlocal_api_key: str = os.getenv("PAYMENTS_DLOCAL_API_KEY", "dlocal_key")
    wise_webhook_secret: str = os.getenv("PAYMENTS_WISE_WEBHOOK_SECRET", "whsec_wise")
    wise_api_key: str = os.getenv("PAYMENTS_WISE_API_KEY", "wise_sandbox")
    queue_name: str = os.getenv("PAYMENTS_QUEUE_NAME", "payments-events")


@lru_cache()
def get_settings() -> Settings:
    return Settings()


__all__ = ["Settings", "get_settings"]
