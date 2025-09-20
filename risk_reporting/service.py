"""Core risk analytics used by the reporting stack."""

from __future__ import annotations

import math
from collections import defaultdict
from typing import Dict, Iterable, Tuple

from .models import RiskReport, Trade


class RiskService:
    """Aggregate risk metrics for a collection of trades.

    The implementation intentionally keeps the analytics deterministic and
    dependency free so it can be executed in a unit test environment.
    """

    def __init__(self, confidence: float = 0.95) -> None:
        if not 0 < confidence < 1:
            raise ValueError("confidence must be between 0 and 1")
        self._confidence = confidence
        # Convert confidence to the appropriate z-score for a normal
        # distribution. We only need the upper tail.
        self._z_score = self._confidence_to_z_score(confidence)

    @staticmethod
    def _confidence_to_z_score(confidence: float) -> float:
        # Lookup table for common confidence levels. Falls back to the
        # inverse error function for other values.
        lookups = {0.90: 1.2816, 0.95: 1.6449, 0.99: 2.3263}
        if confidence in lookups:
            return lookups[confidence]
        # Fallback using erfcinv so we do not depend on scipy.
        return math.sqrt(2) * math.erfcinv(2 * (1 - confidence))

    def generate_report(self, trades: Iterable[Trade]) -> RiskReport:
        """Return a :class:`RiskReport` describing the supplied trades."""

        trade_list = list(trades)
        if not trade_list:
            return RiskReport(0.0, 0.0, 0.0, {}, {})

        gross, net = self._compute_exposure(trade_list)
        hedged_var, baseline_var, var_by_ccy = self._compute_var(trade_list)
        delta_breakdown = self._compute_delta_breakdown(trade_list)
        savings_percentages = self._compute_savings_percentages(
            hedged_var, baseline_var, var_by_ccy
        )
        return RiskReport(
            gross_exposure=gross,
            net_exposure=net,
            value_at_risk=hedged_var,
            delta_breakdown=delta_breakdown,
            savings_percentages=savings_percentages,
        )

    def _compute_exposure(self, trades: Iterable[Trade]) -> Tuple[float, float]:
        gross = 0.0
        net = 0.0
        for trade in trades:
            exposure = trade.exposure()
            gross += abs(exposure)
            net += exposure
        return gross, net

    def _compute_var(
        self, trades: Iterable[Trade]
    ) -> Tuple[float, float, Dict[str, Tuple[float, float]]]:
        """Return hedged portfolio VaR, baseline VaR and per currency values."""

        variance_hedged = 0.0
        variance_baseline = 0.0
        variance_by_ccy: Dict[str, Tuple[float, float]] = defaultdict(lambda: [0.0, 0.0])
        for trade in trades:
            base = trade.exposure() * trade.delta * trade.volatility
            baseline_component = base
            hedged_component = base * (1 - trade.hedge_ratio)
            variance_baseline += baseline_component**2
            variance_hedged += hedged_component**2
            bucket = variance_by_ccy[trade.currency]
            bucket[0] += hedged_component**2
            bucket[1] += baseline_component**2
        hedged_var = self._z_score * math.sqrt(variance_hedged)
        baseline_var = self._z_score * math.sqrt(variance_baseline)
        per_currency = {
            currency: (
                self._z_score * math.sqrt(hedged),
                self._z_score * math.sqrt(baseline),
            )
            for currency, (hedged, baseline) in variance_by_ccy.items()
        }
        return hedged_var, baseline_var, per_currency

    def _compute_delta_breakdown(self, trades: Iterable[Trade]) -> Dict[str, float]:
        breakdown: Dict[str, float] = defaultdict(float)
        for trade in trades:
            breakdown[trade.currency] += trade.notional * trade.delta
        return dict(sorted(breakdown.items()))

    def _compute_savings_percentages(
        self,
        hedged_var: float,
        baseline_var: float,
        var_by_ccy: Dict[str, Tuple[float, float]],
    ) -> Dict[str, float]:
        """Compute savings percentages overall and by currency."""

        savings: Dict[str, float] = {}
        savings["portfolio"] = self._savings_pct(hedged_var, baseline_var)
        for currency, (hedged, baseline) in var_by_ccy.items():
            savings[currency] = self._savings_pct(hedged, baseline)
        return dict(sorted(savings.items()))

    @staticmethod
    def _savings_pct(hedged: float, baseline: float) -> float:
        if baseline == 0:
            return 0.0
        return (baseline - hedged) / baseline * 100
