"""Async client wrapper for QuickBooks Online APIs."""

from __future__ import annotations

from typing import Any, Dict, Optional

import httpx

from .config import QBOConfig
from .oauth import OAuthError, QBOOAuthClient


class QBOClient:
    base_url = "https://sandbox-quickbooks.api.intuit.com"  # default

    def __init__(self, config: QBOConfig, oauth: QBOOAuthClient) -> None:
        self.config = config
        self.oauth = oauth
        if config.environment == "production":
            self.base_url = "https://quickbooks.api.intuit.com"
        self._company_currency: Optional[str] = None

    async def _headers(self) -> Dict[str, str]:
        token = await self.oauth.get_access_token()
        return {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    async def get_invoice(self, invoice_id: str) -> Dict[str, Any]:
        url = f"{self.base_url}/v3/company/{self.config.realm_id}/invoice/{invoice_id}"
        params = {"minorversion": "65"}
        async with httpx.AsyncClient(timeout=self.config.http_timeout) as client:
            response = await client.get(url, headers=await self._headers(), params=params)
        if response.status_code == 404:
            raise KeyError(f"Invoice {invoice_id} not found")
        if response.status_code >= 400:
            raise RuntimeError(f"Invoice fetch failed: {response.text}")
        data = response.json()
        return data["Invoice"] if "Invoice" in data else data

    async def get_company_currency(self) -> str:
        if self._company_currency:
            return self._company_currency

        url = f"{self.base_url}/v3/company/{self.config.realm_id}/companyinfo/{self.config.realm_id}"
        async with httpx.AsyncClient(timeout=self.config.http_timeout) as client:
            response = await client.get(url, headers=await self._headers())
        if response.status_code >= 400:
            raise RuntimeError(f"Company info fetch failed: {response.text}")
        payload = response.json()
        info = payload.get("CompanyInfo", {})
        currency = info.get("HomeCurrency") or info.get("CurrencyRef", {}).get("value")
        if not currency:
            raise RuntimeError("Could not determine home currency")
        self._company_currency = currency
        return currency

    async def ensure_webhook_subscription(self, endpoint_url: str) -> None:
        """Ensures the webhook subscription exists.

        Intuit manages subscriptions through the developer portal; this method is a
        best-effort helper that records intent and validates configuration.
        """

        if not endpoint_url.startswith("https://"):
            raise ValueError("Webhook endpoint must be https")
        # In production you would call the Subscriptions API here. For now we
        # simply validate configuration to avoid silent misconfiguration.


__all__ = ["QBOClient"]
