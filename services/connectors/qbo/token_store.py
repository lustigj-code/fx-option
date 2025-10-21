"""Token storage for QBO OAuth tokens using Redis."""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Optional

import redis

from services.database.config import get_settings


class RedisTokenStore:
    """Redis-backed token storage for QBO OAuth tokens."""

    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """Initialize with Redis client.

        Args:
            redis_client: Optional Redis client. If not provided, creates one from settings.
        """
        if redis_client:
            self.redis = redis_client
        else:
            settings = get_settings()
            self.redis = redis.from_url(settings.redis_url, decode_responses=True)

    def _get_key(self, realm_id: str) -> str:
        """Get Redis key for a realm's tokens."""
        return f"qbo:tokens:{realm_id}"

    def save_tokens(
        self,
        realm_id: str,
        access_token: str,
        refresh_token: str,
        expires_in: int,
        token_type: str = "Bearer",
    ) -> None:
        """Save OAuth tokens to Redis.

        Args:
            realm_id: QuickBooks company/realm ID
            access_token: OAuth access token
            refresh_token: OAuth refresh token
            expires_in: Token expiration in seconds
            token_type: Token type (usually "Bearer")
        """
        key = self._get_key(realm_id)

        token_data = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": token_type,
            "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # Store with expiration (add buffer to allow for refresh)
        ttl = expires_in + 3600  # Add 1 hour buffer
        self.redis.setex(key, ttl, json.dumps(token_data))

    def get_tokens(self, realm_id: str) -> Optional[dict]:
        """Get OAuth tokens from Redis.

        Args:
            realm_id: QuickBooks company/realm ID

        Returns:
            Dictionary with token data, or None if not found
        """
        key = self._get_key(realm_id)
        data = self.redis.get(key)

        if not data:
            return None

        return json.loads(data)

    def get_access_token(self, realm_id: str) -> Optional[str]:
        """Get just the access token.

        Args:
            realm_id: QuickBooks company/realm ID

        Returns:
            Access token string, or None if not found or expired
        """
        tokens = self.get_tokens(realm_id)
        if not tokens:
            return None

        # Check if expired
        expires_at = datetime.fromisoformat(tokens["expires_at"])
        if expires_at <= datetime.now(timezone.utc):
            return None

        return tokens["access_token"]

    def get_refresh_token(self, realm_id: str) -> Optional[str]:
        """Get the refresh token.

        Args:
            realm_id: QuickBooks company/realm ID

        Returns:
            Refresh token string, or None if not found
        """
        tokens = self.get_tokens(realm_id)
        if not tokens:
            return None

        return tokens["refresh_token"]

    def is_token_valid(self, realm_id: str) -> bool:
        """Check if access token is still valid.

        Args:
            realm_id: QuickBooks company/realm ID

        Returns:
            True if token exists and not expired, False otherwise
        """
        tokens = self.get_tokens(realm_id)
        if not tokens:
            return False

        expires_at = datetime.fromisoformat(tokens["expires_at"])
        # Consider valid if more than 5 minutes remaining
        return expires_at > datetime.now(timezone.utc) + timedelta(minutes=5)

    def delete_tokens(self, realm_id: str) -> bool:
        """Delete tokens for a realm.

        Args:
            realm_id: QuickBooks company/realm ID

        Returns:
            True if deleted, False if not found
        """
        key = self._get_key(realm_id)
        return bool(self.redis.delete(key))

    def list_realms(self) -> list[str]:
        """List all realm IDs that have stored tokens.

        Returns:
            List of realm IDs
        """
        pattern = "qbo:tokens:*"
        keys = self.redis.keys(pattern)
        return [key.split(":")[-1] for key in keys]

    def get_token_info(self, realm_id: str) -> Optional[dict]:
        """Get token metadata without exposing actual tokens.

        Args:
            realm_id: QuickBooks company/realm ID

        Returns:
            Dictionary with token metadata (expires_at, created_at, is_valid)
        """
        tokens = self.get_tokens(realm_id)
        if not tokens:
            return None

        return {
            "realm_id": realm_id,
            "token_type": tokens.get("token_type", "Bearer"),
            "expires_at": tokens["expires_at"],
            "created_at": tokens["created_at"],
            "is_valid": self.is_token_valid(realm_id),
        }


class InMemoryTokenStore:
    """In-memory token storage for development/testing."""

    def __init__(self):
        """Initialize empty token storage."""
        self._tokens: dict[str, dict] = {}

    def save_tokens(
        self,
        realm_id: str,
        access_token: str,
        refresh_token: str,
        expires_in: int,
        token_type: str = "Bearer",
    ) -> None:
        """Save OAuth tokens to memory."""
        self._tokens[realm_id] = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": token_type,
            "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    def get_tokens(self, realm_id: str) -> Optional[dict]:
        """Get OAuth tokens from memory."""
        return self._tokens.get(realm_id)

    def get_access_token(self, realm_id: str) -> Optional[str]:
        """Get just the access token."""
        tokens = self.get_tokens(realm_id)
        if not tokens:
            return None

        expires_at = datetime.fromisoformat(tokens["expires_at"])
        if expires_at <= datetime.now(timezone.utc):
            return None

        return tokens["access_token"]

    def get_refresh_token(self, realm_id: str) -> Optional[str]:
        """Get the refresh token."""
        tokens = self.get_tokens(realm_id)
        if not tokens:
            return None

        return tokens["refresh_token"]

    def is_token_valid(self, realm_id: str) -> bool:
        """Check if access token is still valid."""
        tokens = self.get_tokens(realm_id)
        if not tokens:
            return False

        expires_at = datetime.fromisoformat(tokens["expires_at"])
        return expires_at > datetime.now(timezone.utc) + timedelta(minutes=5)

    def delete_tokens(self, realm_id: str) -> bool:
        """Delete tokens for a realm."""
        if realm_id in self._tokens:
            del self._tokens[realm_id]
            return True
        return False

    def list_realms(self) -> list[str]:
        """List all realm IDs that have stored tokens."""
        return list(self._tokens.keys())

    def get_token_info(self, realm_id: str) -> Optional[dict]:
        """Get token metadata without exposing actual tokens."""
        tokens = self.get_tokens(realm_id)
        if not tokens:
            return None

        return {
            "realm_id": realm_id,
            "token_type": tokens.get("token_type", "Bearer"),
            "expires_at": tokens["expires_at"],
            "created_at": tokens["created_at"],
            "is_valid": self.is_token_valid(realm_id),
        }
