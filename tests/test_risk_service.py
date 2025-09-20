from __future__ import annotations

import math

import pytest

from risk_reporting import (
    AdminConsumer,
    PortalConsumer,
    RiskGateway,
    RiskReport,
    RiskService,
    Trade,
)


@pytest.fixture
def sample_trades() -> list[Trade]:
    return [
        Trade(
            trade_id="T1",
            currency="USD",
            notional=1_000_000,
            spot_rate=1.0,
            delta=0.45,
            volatility=0.12,
            hedge_ratio=0.3,
        ),
        Trade(
            trade_id="T2",
            currency="EUR",
            notional=-800_000,
            spot_rate=1.1,
            delta=0.55,
            volatility=0.18,
            hedge_ratio=0.5,
        ),
        Trade(
            trade_id="T3",
            currency="USD",
            notional=500_000,
            spot_rate=1.0,
            delta=-0.25,
            volatility=0.2,
            hedge_ratio=0.1,
        ),
    ]


def test_service_adds_richer_metrics(sample_trades: list[Trade]) -> None:
    service = RiskService()
    report = service.generate_report(sample_trades)

    assert isinstance(report, RiskReport)
    assert report.gross_exposure == pytest.approx(2_380_000)
    assert report.net_exposure == pytest.approx(620_000)
    assert report.value_at_risk == pytest.approx(101_831.979, rel=1e-6)
    assert report.delta_breakdown == {
        "EUR": pytest.approx(-440_000),
        "USD": pytest.approx(325_000),
    }

    expected_savings = {
        "EUR": pytest.approx(50.0),
        "USD": pytest.approx(26.0756, rel=1e-4),
        "portfolio": pytest.approx(41.3214, rel=1e-4),
    }
    assert report.savings_percentages.keys() == expected_savings.keys()
    for key in expected_savings:
        assert report.savings_percentages[key] == expected_savings[key]


def test_gateway_payload_exposes_new_fields(sample_trades: list[Trade]) -> None:
    payload = RiskGateway().build_payload(sample_trades)
    assert payload["value_at_risk"] == pytest.approx(101_831.979, rel=1e-6)
    assert payload["delta_breakdown"]["EUR"] == pytest.approx(-440_000)
    assert payload["delta_breakdown"]["USD"] == pytest.approx(325_000)
    assert payload["savings_percentages"]["portfolio"] == pytest.approx(
        41.3214, rel=1e-4
    )
    assert "metadata" in payload
    assert math.isclose(payload["metadata"]["confidence"], 0.95)
    assert payload["metadata"]["z_score"] == pytest.approx(1.6449, rel=1e-4)


def test_portal_consumer_surfaces_var_and_savings(sample_trades: list[Trade]) -> None:
    report = RiskService().generate_report(sample_trades)
    model = PortalConsumer().build_view_model(report)
    assert model["headline"]["valueAtRisk"] == pytest.approx(101_831.979, rel=1e-6)
    assert model["deltaBreakdown"]["EUR"] == pytest.approx(-440_000)
    assert model["savings"]["portfolio"] == pytest.approx(41.3214, rel=1e-4)


def test_admin_consumer_includes_delta_and_savings(sample_trades: list[Trade]) -> None:
    report = RiskService().generate_report(sample_trades)
    model = AdminConsumer().build_view_model(report)

    assert model["summary"]["valueAtRisk"] == pytest.approx(101_831.979, rel=1e-6)
    assert model["summary"]["portfolioSavings"] == pytest.approx(41.3214, rel=1e-4)

    usd_row = next(row for row in model["rows"] if row["currency"] == "USD")
    eur_row = next(row for row in model["rows"] if row["currency"] == "EUR")

    assert usd_row == {
        "currency": "USD",
        "delta": pytest.approx(325_000),
        "savingsPct": pytest.approx(26.0756, rel=1e-4),
    }
    assert eur_row == {
        "currency": "EUR",
        "delta": pytest.approx(-440_000),
        "savingsPct": pytest.approx(50.0),
    }
