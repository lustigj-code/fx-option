from datetime import date

import pytest

from services.risk import RiskService


@pytest.fixture
def sample_quotes():
    return [
        {"pair": "EURUSD", "spot": 1.09, "volatility": 0.12},
        {"pair": "GBPUSD", "spot": 1.24, "volatility": 0.15},
    ]


def test_generate_plan_creates_weekly_buckets(sample_quotes):
    valuation_date = date(2024, 1, 5)
    service = RiskService(sample_quotes, valuation_date=valuation_date)

    exposures = [
        {
            "pair": "EURUSD",
            "expiry": date(2024, 1, 10),
            "side": "buy",
            "delta": 5.0,
            "k_distribution": {"25D": 0.5, "ATM": 0.5},
        },
        {
            "pair": "EURUSD",
            "expiry": date(2024, 1, 12),
            "side": "sell",
            "delta": 2.0,
        },
        {
            "pair": "GBPUSD",
            "expiry": date(2024, 1, 16),
            "side": "buy",
            "delta": 4.0,
        },
    ]

    hedges = [
        {
            "pair": "EURUSD",
            "expiry": date(2024, 1, 11),
            "side": "sell",
            "delta": 1.0,
        },
        {
            "pair": "GBPUSD",
            "expiry": date(2024, 1, 17),
            "side": "sell",
            "delta": 4.0,
        },
    ]

    plan = service.generate_plan(exposures, hedges)

    eurusd_bucket = next(
        bucket for bucket in plan["buckets"] if bucket["pair"] == "EURUSD"
    )
    assert eurusd_bucket["week_start"] == "2024-01-08"
    assert eurusd_bucket["week_end"] == "2024-01-14"
    assert pytest.approx(eurusd_bucket["pre_delta"], rel=1e-6) == 3.0
    assert pytest.approx(eurusd_bucket["post_delta"], rel=1e-6) == 2.0

    # Pre and post VaR should be positive and the hedge should reduce it.
    assert eurusd_bucket["pre_var"] > 0
    assert eurusd_bucket["post_var"] < eurusd_bucket["pre_var"]
    assert "delta_reduction_pct" in eurusd_bucket
    assert "var_reduction_pct" in eurusd_bucket
    assert "average_tenor_days" in eurusd_bucket

    execution_items = plan["execution_plan"]
    assert len(execution_items) == 1
    instruction = execution_items[0]
    assert instruction["pair"] == "EURUSD"
    assert instruction["expiry"] == "2024-01-14"
    assert instruction["side"] == "sell"
    assert pytest.approx(instruction["qty"], rel=1e-6) == 2.0

    distribution = instruction["k_distribution"]
    assert pytest.approx(distribution["25D"], rel=1e-3) == 0.3571428
    assert pytest.approx(distribution["ATM"], rel=1e-3) == 0.6428571
    assert pytest.approx(sum(distribution.values()), rel=1e-6) == 1.0

    savings = plan["netting_savings"]
    assert savings["delta"] > 0
    assert savings["var"] > 0
    assert "delta_pct" in savings
    assert "var_pct" in savings


def test_json_plan_and_display(sample_quotes):
    service = RiskService(sample_quotes, valuation_date=date(2024, 1, 5))
    exposures = [
        {"pair": "EURUSD", "expiry": "2024-01-10", "side": "buy", "delta": 1.0},
    ]
    hedges = []

    json_plan = service.plan_as_json(exposures, hedges)
    assert "\n" in json_plan
    assert "EURUSD" in json_plan

    display = service.display_netting_savings(exposures, hedges)
    assert "Netting saved" in display
