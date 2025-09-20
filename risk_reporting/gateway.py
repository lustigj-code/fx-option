"""Gateway layer that exposes the risk report through an API friendly payload."""

from __future__ import annotations

from typing import Iterable

from .models import RiskReport, Trade
from .service import RiskService


class RiskGateway:
    """Compose the risk report for downstream services."""

    def __init__(self, service: RiskService | None = None) -> None:
        self._service = service or RiskService()

    def build_payload(self, trades: Iterable[Trade]) -> dict:
        """Return a dictionary payload ready to be serialised to JSON."""

        report = self._service.generate_report(trades)
        payload = report.to_dict()
        payload["metadata"] = {
            "confidence": self._service._confidence,
            "z_score": self._service._z_score,
        }
        return payload

    def report_for_trade_ids(self, trades: Iterable[Trade]) -> RiskReport:
        """Proxy around :meth:`RiskService.generate_report` for convenience."""

        return self._service.generate_report(trades)
