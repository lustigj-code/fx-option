"""Gateway service configuration utilities.

This module provides a dataclass-backed configuration loader that reads the
runtime settings for the gateway service from environment variables.  The
resulting settings object is immutable, making it safe to pass across the
application without worrying about accidental mutation.

Example
-------
>>> import os
>>> os.environ["GATEWAY_INPUT_PATH"] = "/data/in"
>>> os.environ["GATEWAY_OUTPUT_PATH"] = "/data/out"
>>> os.environ["GATEWAY_CLIENT_ID"] = "client"
>>> os.environ["GATEWAY_CLIENT_SECRET"] = "secret"
>>> os.environ["GATEWAY_API_URL"] = "https://api.example.com"
>>> from services.gateway.settings import load_settings
>>> settings = load_settings()
>>> settings.dry_run
False
"""
from __future__ import annotations

from dataclasses import dataclass, replace
from pathlib import Path
from typing import Mapping, Optional
import os

__all__ = [
    "GatewayCredentials",
    "GatewaySettings",
    "load_settings",
]


@dataclass(frozen=True)
class GatewayCredentials:
    """Authentication credentials for the upstream API."""

    client_id: str
    client_secret: str


@dataclass(frozen=True)
class GatewaySettings:
    """Configuration values required for running the gateway service."""

    input_path: Path
    output_path: Path
    dry_run: bool
    credentials: GatewayCredentials
    api_url: str

    @classmethod
    def from_env(
        cls,
        env: Optional[Mapping[str, str]] = None,
        *,
        prefix: str = "GATEWAY_",
    ) -> "GatewaySettings":
        """Create a :class:`GatewaySettings` instance from environment variables.

        Parameters
        ----------
        env:
            A mapping containing the environment variables.  When ``None`` the
            process environment is used.  The mapping is treated as
            case-sensitive.
        prefix:
            Optional prefix used for environment variable lookups.  This allows
            the loader to be reused for differently named variables during
            testing.

        Raises
        ------
        RuntimeError
            If any required environment variable is missing or empty.
        ValueError
            If a boolean environment variable cannot be coerced into a boolean
            value.
        """

        env_mapping: Mapping[str, str]
        if env is None:
            env_mapping = os.environ
        else:
            env_mapping = env

        def require(name: str) -> str:
            key = f"{prefix}{name}"
            value = env_mapping.get(key)
            if value is None or not value.strip():
                raise RuntimeError(f"Missing environment variable: {key}")
            return value

        input_path = Path(require("INPUT_PATH"))
        output_path = Path(require("OUTPUT_PATH"))
        dry_run = _parse_bool(env_mapping.get(f"{prefix}DRY_RUN", "false"))

        credentials = GatewayCredentials(
            client_id=require("CLIENT_ID"),
            client_secret=require("CLIENT_SECRET"),
        )

        api_url = require("API_URL")

        return cls(
            input_path=input_path,
            output_path=output_path,
            dry_run=dry_run,
            credentials=credentials,
            api_url=api_url,
        )

    def with_overrides(
        self,
        *,
        dry_run: Optional[bool] = None,
        input_path: Optional[Path] = None,
        output_path: Optional[Path] = None,
    ) -> "GatewaySettings":
        """Return a new settings object with a subset of fields overridden."""

        updates = {}
        if dry_run is not None:
            updates["dry_run"] = dry_run
        if input_path is not None:
            updates["input_path"] = Path(input_path)
        if output_path is not None:
            updates["output_path"] = Path(output_path)
        return replace(self, **updates)


def load_settings() -> GatewaySettings:
    """Load settings from the current environment."""

    return GatewaySettings.from_env()


def _parse_bool(raw: str) -> bool:
    """Convert a string environment value into a boolean.

    Accepted truthy values are ``"1"``, ``"true"``, ``"t"`` and ``"yes"``.
    Accepted falsy values are ``"0"``, ``"false"``, ``"f"`` and ``"no"``.
    The comparison is case-insensitive.  Any other value raises ``ValueError``.
    """

    truthy = {"1", "true", "t", "yes", "y"}
    falsy = {"0", "false", "f", "no", "n"}
    value = raw.strip().lower()
    if value in truthy:
        return True
    if value in falsy:
        return False
    raise ValueError(f"Cannot interpret '{raw}' as a boolean value")
