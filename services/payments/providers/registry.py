"""Provider registry helpers."""
from __future__ import annotations

from .dlocal_provider import dlocal_collect_provider
from .stripe_provider import stripe_collect_provider
from .wise_provider import wise_payout_provider


COLLECT_PROVIDERS = {
    "USD": stripe_collect_provider,
    "EUR": stripe_collect_provider,
    "BRL": dlocal_collect_provider,
}

PAYOUT_PROVIDERS = {
    "USD": wise_payout_provider,
    "EUR": wise_payout_provider,
    "BRL": wise_payout_provider,
}


def get_collect_provider(currency: str):
    return COLLECT_PROVIDERS.get(currency.upper(), stripe_collect_provider)


def get_payout_provider(currency: str):
    return PAYOUT_PROVIDERS.get(currency.upper(), wise_payout_provider)


__all__ = ["get_collect_provider", "get_payout_provider"]
