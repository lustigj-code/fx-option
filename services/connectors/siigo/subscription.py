"""Webhook subscription tool for Siigo."""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Dict, Iterable, Optional

from .config import SiigoEnvironment, resolve_environment
from .exceptions import AuthenticationError, SubscriptionError
from .http import DEFAULT_HTTP_CLIENT, HttpResponse, SimpleHttpClient


@dataclass
class SiigoCredentials:
    """Holds authentication information for Siigo."""

    username: str
    access_key: str
    client_id: str
    client_secret: str


class SiigoWebhookSubscription:
    """Encapsulates the Siigo webhook subscription flow."""

    def __init__(
        self,
        credentials: SiigoCredentials,
        environment: str | SiigoEnvironment = "sandbox",
        http_client: Optional[SimpleHttpClient] = None,
    ):
        self.credentials = credentials
        if isinstance(environment, SiigoEnvironment):
            self.environment = environment
        else:
            self.environment = resolve_environment(environment)
        self.http_client = http_client or DEFAULT_HTTP_CLIENT
        self._token: Optional[str] = None
        self._token_expiry: Optional[float] = None

    # Authentication -----------------------------------------------------------------
    def authenticate(self, force: bool = False) -> str:
        """Authenticate against Siigo and return an access token."""

        if not force and self._token and self._token_expiry and time.time() < self._token_expiry:
            return self._token

        payload = {
            "username": self.credentials.username,
            "access_key": self.credentials.access_key,
            "client_id": self.credentials.client_id,
            "client_secret": self.credentials.client_secret,
        }
        response = self.http_client.post_json(self.environment.auth_url, payload)
        token = self._validate_auth_response(response)
        self._token = token
        self._token_expiry = time.time() + 60 * 25  # default TTL 25 minutes
        return token

    def _validate_auth_response(self, response: HttpResponse) -> str:
        if response.status_code >= 400:
            message = response.body.get("error") or response.body.get("message") or "Authentication failed"
            raise AuthenticationError(str(message))
        token = response.body.get("access_token")
        if not token:
            raise AuthenticationError("Siigo authentication response missing access_token")
        return str(token)

    # Subscriptions -------------------------------------------------------------------
    def create_subscription(
        self,
        target_url: str,
        events: Iterable[str],
        *,
        active: bool = True,
        headers: Optional[Dict[str, str]] = None,
        description: Optional[str] = None,
    ) -> Dict[str, object]:
        """Create a webhook subscription."""

        token = self.authenticate()
        payload: Dict[str, object] = {
            "url": target_url,
            "active": active,
            "event": list(events),
        }
        if description:
            payload["description"] = description
        if headers:
            payload["headers"] = headers

        auth_headers = {"Authorization": f"Bearer {token}"}
        response = self.http_client.post_json(self.environment.subscriptions_url, payload, headers=auth_headers)
        return self._validate_subscription_response(response)

    def _validate_subscription_response(self, response: HttpResponse) -> Dict[str, object]:
        if response.status_code >= 400:
            message = response.body.get("error") or response.body.get("message") or "Subscription failed"
            raise SubscriptionError(str(message))
        if "id" not in response.body:
            raise SubscriptionError("Unexpected subscription response from Siigo")
        return response.body


__all__ = ["SiigoCredentials", "SiigoWebhookSubscription"]
