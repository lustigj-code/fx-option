from __future__ import annotations

import json
from dataclasses import asdict
from datetime import date, datetime
from typing import Iterable, List, Mapping, Sequence

from .bucketing import BucketMetrics, build_bucket_metrics
from .models import Exposure, Hedge, Position, Quote


class RiskService:
    """Produce risk buckets, savings from netting, and an execution plan."""

    def __init__(
        self,
        quotes: Sequence[Quote | Mapping[str, float]],
        valuation_date: date | None = None,
    ) -> None:
        self.valuation_date = valuation_date or date.today()
        self.quotes = {quote.pair: quote for quote in self._coerce_quotes(quotes)}

    def generate_plan(
        self,
        exposures: Iterable[Exposure | Mapping[str, object]],
        hedges: Iterable[Hedge | Mapping[str, object]],
    ) -> dict:
        """Create the full risk plan summary."""

        exposure_models = [self._coerce_position(item, Exposure) for item in exposures]
        hedge_models = [self._coerce_position(item, Hedge) for item in hedges]

        metrics = build_bucket_metrics(
            exposure_models, hedge_models, self.quotes, self.valuation_date
        )
        plan = self._build_execution_list(metrics)

        return {
            "buckets": [self._serialise_bucket(metric) for metric in metrics.values()],
            "execution_plan": plan,
            "netting_savings": self._compute_savings(metrics),
        }

    def plan_as_json(
        self,
        exposures: Iterable[Exposure | Mapping[str, object]],
        hedges: Iterable[Hedge | Mapping[str, object]],
    ) -> str:
        """Render the plan as JSON for the admin interface."""

        plan = self.generate_plan(exposures, hedges)
        return json.dumps(plan, default=_json_default, indent=2, sort_keys=True)

    def display_netting_savings(
        self,
        exposures: Iterable[Exposure | Mapping[str, object]],
        hedges: Iterable[Hedge | Mapping[str, object]],
    ) -> str:
        """Return a formatted view of the savings from netting."""

        summary = self.generate_plan(exposures, hedges)
        savings = summary["netting_savings"]
        return (
            "Netting saved {delta:.2f} delta units and {var:.2f} VaR units.".format(
                delta=savings["delta"],
                var=savings["var"],
            )
        )

    def _build_execution_list(self, metrics: Mapping[tuple, BucketMetrics]) -> List[dict]:
        plan: List[dict] = []
        for metric in metrics.values():
            residual = metric.post_delta
            if abs(residual) < 1e-9:
                continue
            side = "sell" if residual > 0 else "buy"
            plan.append(
                {
                    "pair": metric.pair,
                    "expiry": metric.week_end.isoformat(),
                    "side": side,
                    "qty": abs(residual),
                    "k_distribution": metric.distribution,
                }
            )
        return plan

    def _compute_savings(self, metrics: Mapping[tuple, BucketMetrics]) -> dict:
        pre_delta = sum(abs(metric.pre_delta) for metric in metrics.values())
        post_delta = sum(abs(metric.post_delta) for metric in metrics.values())

        pre_var = sum(metric.pre_var for metric in metrics.values())
        post_var = sum(metric.post_var for metric in metrics.values())

        delta_savings = pre_delta - post_delta
        var_savings = pre_var - post_var
        return {
            "delta": delta_savings,
            "var": var_savings,
            "delta_pct": (delta_savings / pre_delta) if pre_delta else 0.0,
            "var_pct": (var_savings / pre_var) if pre_var else 0.0,
        }

    def _coerce_quotes(
        self, quotes: Sequence[Quote | Mapping[str, float]]
    ) -> List[Quote]:
        parsed: List[Quote] = []
        for item in quotes:
            if isinstance(item, Quote):
                parsed.append(item)
                continue
            parsed.append(
                Quote(
                    pair=str(item["pair"]),
                    spot=float(item["spot"]),
                    volatility=float(item["volatility"]),
                )
            )
        return parsed

    def _coerce_position(
        self, item: Position | Mapping[str, object], cls: type[Position]
    ) -> Position:
        if isinstance(item, cls):
            return item
        expiry = item.get("expiry")  # type: ignore[index]
        if isinstance(expiry, str):
            expiry_date = date.fromisoformat(expiry)
        elif isinstance(expiry, datetime):
            expiry_date = expiry.date()
        elif isinstance(expiry, date):
            expiry_date = expiry
        else:
            raise TypeError("expiry must be a date or ISO formatted string")

        distribution = item.get("k_distribution") if isinstance(item, Mapping) else None
        if distribution is None:
            distribution = {}
        return cls(  # type: ignore[call-arg]
            pair=str(item["pair"]),  # type: ignore[index]
            expiry=expiry_date,
            side=str(item.get("side", "buy")),  # type: ignore[arg-type]
            delta=float(item.get("delta") or item.get("qty") or 0.0),  # type: ignore[index]
            k_distribution=dict(distribution),
        )

    def _serialise_bucket(self, metric: BucketMetrics) -> dict:
        data = asdict(metric)
        data["week_start"] = metric.week_start.isoformat()
        data["week_end"] = metric.week_end.isoformat()
        return data


def _json_default(value):
    if isinstance(value, date):
        return value.isoformat()
    raise TypeError(f"Object of type {type(value)!r} is not JSON serialisable")
