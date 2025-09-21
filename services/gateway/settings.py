"""Configuration helpers for the gateway service."""
from __future__ import annotations

import os
import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Dict


DEFAULT_SCOPE_RULES = {
    "post:/api/quotes/binding": "quotes:execute",
    "post:/api/risk/plan": "risk:review",
    "post:/api/execution/orders": "execution:write",
}


@dataclass(frozen=True)
class GatewaySettings:
    """Runtime configuration for the gateway."""

    storage_dir: Path
    dry_run: bool = True
    host: str = "0.0.0.0"
    port: int = 8000
    jwt_secret: str | None = None
    jwt_issuer: str | None = None
    jwt_audience: str | None = None
    scope_rules: Dict[str, str] = field(default_factory=dict)


@lru_cache(maxsize=1)
def get_settings() -> GatewaySettings:
    storage_path = Path(os.getenv("GATEWAY_STORAGE_DIR", "data/execution-orders")).resolve()
    storage_path.mkdir(parents=True, exist_ok=True)

    dry_run_env = os.getenv("GATEWAY_DRY_RUN", "true").lower()
    dry_run = dry_run_env not in {"0", "false", "no"}

    host = os.getenv("GATEWAY_HOST", "0.0.0.0")
    port = int(os.getenv("GATEWAY_PORT", "8000"))

    jwt_secret = os.getenv("GATEWAY_JWT_SECRET")
    jwt_issuer = os.getenv("GATEWAY_JWT_ISSUER")
    jwt_audience = os.getenv("GATEWAY_JWT_AUDIENCE")

    scope_rules_env = os.getenv("GATEWAY_SCOPE_RULES")
    scope_rules: Dict[str, str]
    if scope_rules_env:
        scope_rules = {}
        for item in scope_rules_env.split(","):
            if not item:
                continue
            if "=" not in item:
                continue
            key, value = item.split("=", 1)
            scope_rules[key.strip().lower()] = value.strip()
    else:
        scope_rules = DEFAULT_SCOPE_RULES.copy()

    return GatewaySettings(
        storage_dir=storage_path,
        dry_run=dry_run,
        host=host,
        port=port,
        jwt_secret=jwt_secret,
        jwt_issuer=jwt_issuer,
        jwt_audience=jwt_audience,
        scope_rules=scope_rules,
    )


__all__ = ["GatewaySettings", "get_settings"]
