"""Configuration utilities for the Siigo connector."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict


@dataclass
class SiigoEnvironment:
    """Represents a Siigo API environment."""

    name: str
    base_url: str
    auth_path: str = "/auth"
    subscriptions_path: str = "/v1/webhooks/subscriptions"

    @property
    def auth_url(self) -> str:
        return f"{self.base_url}{self.auth_path}"

    @property
    def subscriptions_url(self) -> str:
        return f"{self.base_url}{self.subscriptions_path}"


DEFAULT_ENVIRONMENTS: Dict[str, SiigoEnvironment] = {
    "sandbox": SiigoEnvironment(
        name="sandbox",
        base_url="https://api-sandbox.siigo.com",
    ),
    "production": SiigoEnvironment(
        name="production",
        base_url="https://api.siigo.com",
    ),
}


class UnknownEnvironmentError(ValueError):
    """Raised when an unknown environment is requested."""


def resolve_environment(name: str, overrides: Dict[str, SiigoEnvironment] | None = None) -> SiigoEnvironment:
    """Resolve an environment by name.

    Parameters
    ----------
    name:
        The environment name to resolve.
    overrides:
        Optional environment overrides. Useful for tests.
    """

    normalized = (name or "").lower()
    sources = {**DEFAULT_ENVIRONMENTS}
    if overrides:
        sources.update({env.name.lower(): env for env in overrides.values()})

    if normalized not in sources:
        raise UnknownEnvironmentError(f"Unknown Siigo environment: {name}")
    return sources[normalized]
