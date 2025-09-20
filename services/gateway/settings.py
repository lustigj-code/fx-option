"""Configuration helpers for the gateway service."""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


@dataclass(frozen=True)
class GatewaySettings:
    """Runtime configuration for the gateway."""

    storage_dir: Path
    dry_run: bool = True
    host: str = "0.0.0.0"
    port: int = 8000


@lru_cache(maxsize=1)
def get_settings() -> GatewaySettings:
    storage_path = Path(os.getenv("GATEWAY_STORAGE_DIR", "data/execution-orders")).resolve()
    storage_path.mkdir(parents=True, exist_ok=True)

    dry_run_env = os.getenv("GATEWAY_DRY_RUN", "true").lower()
    dry_run = dry_run_env not in {"0", "false", "no"}

    host = os.getenv("GATEWAY_HOST", "0.0.0.0")
    port = int(os.getenv("GATEWAY_PORT", "8000"))

    return GatewaySettings(storage_dir=storage_path, dry_run=dry_run, host=host, port=port)


__all__ = ["GatewaySettings", "get_settings"]
