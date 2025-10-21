"""Authentication configuration settings."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class AuthSettings(BaseSettings):
    """Authentication configuration from environment variables."""

    model_config = SettingsConfigDict(env_prefix="JWT_", env_file=".env")

    secret_key: str = "dev-secret-key-change-in-production-min-32-chars-required"
    algorithm: str = "HS256"
    expiration_minutes: int = 30
    refresh_expiration_days: int = 7

    # Password hashing
    bcrypt_rounds: int = 12

    # Token configuration
    token_url: str = "/api/auth/login"


def get_settings() -> AuthSettings:
    """Get auth settings singleton."""
    return AuthSettings()
