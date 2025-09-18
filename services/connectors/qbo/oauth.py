"""OAuth2 helpers for QuickBooks Online."""

from __future__ import annotations

import time
from typing import Dict, Optional

import httpx

from .config import QBOConfig


class TokenStore:
    """Simple in-memory token store.

    In production this should be backed by a persistent datastore.
    """

    def __init__(self) -> None:
        self._data: Dict[str, Dict[str, str]] = {}

    def save(self, realm_id: str, tokens: Dict[str, str]) -> None:
        self._data[realm_id] = tokens

    def get(self, realm_id: str) -> Optional[Dict[str, str]]:
        return self._data.get(realm_id)


class OAuthError(RuntimeError):
    """Raised when an OAuth operation fails."""


class QBOOAuthClient:
    token_url = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"

    def __init__(self, config: QBOConfig, store: Optional[TokenStore] = None) -> None:
        self.config = config
        self.store = store or TokenStore()

    async def exchange_code(self, code: str) -> Dict[str, str]:
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.config.redirect_uri,
        }
        return await self._request_token(data)

    async def refresh(self, refresh_token: str) -> Dict[str, str]:
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }
        return await self._request_token(data)

    async def get_access_token(self) -> str:
        tokens = self.store.get(self.config.realm_id)
        if not tokens:
            raise OAuthError("No tokens available for realm")

        expiry = tokens.get("expires_at")
        if not expiry or float(expiry) <= time.time() + 60:
            tokens = await self.refresh(tokens["refresh_token"])

        return tokens["access_token"]

    async def _request_token(self, data: Dict[str, str]) -> Dict[str, str]:
        auth = (self.config.client_id, self.config.client_secret)
        async with httpx.AsyncClient(timeout=self.config.http_timeout) as client:
            response = await client.post(self.token_url, data=data, auth=auth)
            if response.status_code >= 400:
                raise OAuthError(f"OAuth token request failed: {response.text}")
            payload = response.json()

        tokens = {
            "access_token": payload["access_token"],
            "refresh_token": payload["refresh_token"],
            "token_type": payload.get("token_type", "bearer"),
            "expires_at": str(time.time() + payload.get("expires_in", 3600)),
        }
        self.store.save(self.config.realm_id, tokens)
        return tokens


__all__ = ["OAuthError", "QBOOAuthClient", "TokenStore"]
