"""Gateway bindings for the pricing orchestrator."""

from __future__ import annotations

from typing import Any, Dict, Mapping

from .orchestrator import QuoteOrchestrator


def bind_quote_endpoint(orchestrator: QuoteOrchestrator):
    """Return a callable endpoint that creates quotes via the orchestrator."""

    def quote_endpoint(payload: Mapping[str, Any]) -> Dict[str, Any]:
        response = orchestrator.generate_quote_from_payload(dict(payload))
        return {
            "price": response.price,
            "pricingModel": response.pricing_model,
        }

    return quote_endpoint
