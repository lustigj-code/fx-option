"""Database configuration settings."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class DatabaseSettings(BaseSettings):
    """Database configuration from environment variables."""

    model_config = SettingsConfigDict(env_prefix="DATABASE_", env_file=".env")

    # PostgreSQL connection
    host: str = "localhost"
    port: int = 5432
    user: str = "fxoption"
    password: str = "fxoption_dev"
    name: str = "fxoption"

    # Redis connection
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: str | None = None

    # Connection pool settings
    pool_size: int = 10
    max_overflow: int = 20
    pool_timeout: int = 30
    pool_recycle: int = 3600

    @property
    def postgres_url(self) -> str:
        """Construct PostgreSQL connection URL."""
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"

    @property
    def async_postgres_url(self) -> str:
        """Construct async PostgreSQL connection URL."""
        return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"

    @property
    def redis_url(self) -> str:
        """Construct Redis connection URL."""
        if self.redis_password:
            return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}/{self.redis_db}"
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"


def get_settings() -> DatabaseSettings:
    """Get database settings singleton."""
    return DatabaseSettings()
