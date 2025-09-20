"""Consumers that adapt the risk report for UI surfaces."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

from .models import RiskReport


@dataclass
class PortalConsumer:
    """Prepare data for the customer facing portal."""

    def build_view_model(self, report: RiskReport) -> Dict[str, object]:
        return {
            "headline": {
                "grossExposure": report.gross_exposure,
                "netExposure": report.net_exposure,
                "valueAtRisk": report.value_at_risk,
            },
            "deltaBreakdown": report.delta_breakdown,
            "savings": report.savings_percentages,
        }


@dataclass
class AdminConsumer:
    """Prepare data for internal admin tooling."""

    def build_view_model(self, report: RiskReport) -> Dict[str, object]:
        rows = []
        for currency, delta in report.delta_breakdown.items():
            rows.append(
                {
                    "currency": currency,
                    "delta": delta,
                    "savingsPct": report.savings_percentages.get(currency, 0.0),
                }
            )
        rows.sort(key=lambda item: item["currency"])
        return {
            "summary": {
                "grossExposure": report.gross_exposure,
                "netExposure": report.net_exposure,
                "valueAtRisk": report.value_at_risk,
                "portfolioSavings": report.savings_percentages.get("portfolio", 0.0),
            },
            "rows": rows,
        }
