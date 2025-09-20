from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Dict, Iterable, Mapping, MutableMapping, Tuple

from .models import Exposure, Hedge, Quote


@dataclass
class _Aggregate:
    delta: float = 0.0
    weight: float = 0.0
    weighted_days: float = 0.0
    distribution: Counter = field(default_factory=Counter)

    def add(self, position: Exposure | Hedge, valuation_date: date) -> None:
        signed = position.signed_delta()
        self.delta += signed

        weight = abs(signed)
        self.weight += weight

        days = max((position.expiry - valuation_date).days, 0)
        self.weighted_days += weight * days

        for strike, ratio in position.distribution().items():
            self.distribution[strike] += weight * ratio

    def average_days(self, default: int = 7) -> int:
        if self.weight == 0:
            return default
        return int(round(self.weighted_days / self.weight))

    def normalised_distribution(self) -> Dict[str, float]:
        if not self.distribution:
            return {"ATM": 1.0}
        total = sum(self.distribution.values())
        if total <= 0:
            return {"ATM": 1.0}
        return {key: value / total for key, value in self.distribution.items()}


@dataclass
class BucketMetrics:
    pair: str
    week_start: date
    week_end: date
    pre_delta: float
    post_delta: float
    pre_var: float
    post_var: float
    distribution: Dict[str, float]
    delta_reduction_pct: float
    var_reduction_pct: float
    average_tenor_days: int


def week_bounds(target_date: date) -> Tuple[date, date]:
    start = target_date - timedelta(days=target_date.weekday())
    end = start + timedelta(days=6)
    return start, end


def _aggregate_positions(
    positions: Iterable[Exposure | Hedge],
    valuation_date: date,
) -> MutableMapping[Tuple[str, date], _Aggregate]:
    buckets: MutableMapping[Tuple[str, date], _Aggregate] = defaultdict(_Aggregate)
    for position in positions:
        week_start, _ = week_bounds(position.expiry)
        buckets[(position.pair, week_start)].add(position, valuation_date)
    return buckets


def build_bucket_metrics(
    exposures: Iterable[Exposure],
    hedges: Iterable[Hedge],
    quotes: Mapping[str, Quote],
    valuation_date: date,
) -> Dict[Tuple[str, date], BucketMetrics]:
    exposure_data = _aggregate_positions(exposures, valuation_date)
    hedge_data = _aggregate_positions(hedges, valuation_date)

    all_keys = set(exposure_data) | set(hedge_data)
    metrics: Dict[Tuple[str, date], BucketMetrics] = {}

    for pair, week_start in sorted(all_keys):
        exposure_bucket = exposure_data.get((pair, week_start), _Aggregate())
        hedge_bucket = hedge_data.get((pair, week_start), _Aggregate())

        week_end = week_start + timedelta(days=6)
        quote = quotes.get(pair)

        pre_delta = exposure_bucket.delta
        post_delta = pre_delta + hedge_bucket.delta

        avg_days_exposure = exposure_bucket.average_days()
        avg_days_combined = _blended_average_days(exposure_bucket, hedge_bucket)

        pre_var = _compute_var(quote, pre_delta, avg_days_exposure)
        post_var = _compute_var(quote, post_delta, avg_days_combined)

        distribution = exposure_bucket.normalised_distribution()
        if exposure_bucket.weight == 0 and hedge_bucket.weight > 0:
            distribution = hedge_bucket.normalised_distribution()

        delta_reduction_pct = 0.0
        if abs(pre_delta) > 1e-9:
            delta_reduction_pct = (abs(pre_delta) - abs(post_delta)) / abs(pre_delta)

        var_reduction_pct = 0.0
        if pre_var > 1e-9:
            var_reduction_pct = (pre_var - post_var) / pre_var

        metrics[(pair, week_start)] = BucketMetrics(
            pair=pair,
            week_start=week_start,
            week_end=week_end,
            pre_delta=pre_delta,
            post_delta=post_delta,
            pre_var=pre_var,
            post_var=post_var,
            distribution=distribution,
            delta_reduction_pct=delta_reduction_pct,
            var_reduction_pct=var_reduction_pct,
            average_tenor_days=avg_days_combined,
        )

    return metrics


def _compute_var(quote: Quote | None, delta: float, days: int) -> float:
    if quote is None:
        return 0.0
    return quote.simple_var(delta, days)


def _blended_average_days(exposure_bucket: _Aggregate, hedge_bucket: _Aggregate) -> int:
    total_weight = exposure_bucket.weight + hedge_bucket.weight
    if total_weight == 0:
        return 7
    combined_days = exposure_bucket.weighted_days + hedge_bucket.weighted_days
    return int(round(combined_days / total_weight))
