from datetime import date

from services.execution_sync.utils import (
    adjusted_limit_price,
    allocate_quantity,
    ladder_strikes,
    monthly_expiries,
    nearest_expiries,
    third_wednesday,
)


def test_third_wednesday():
    assert third_wednesday(2024, 5) == date(2024, 5, 15)


def test_monthly_expiries_sorted():
    expiries = monthly_expiries(date(2024, 1, 10), months_ahead=3)
    assert expiries == [date(2024, 1, 17), date(2024, 2, 21), date(2024, 3, 20)]


def test_nearest_expiries_returns_next_two():
    expiries = [date(2024, 1, 17), date(2024, 2, 21), date(2024, 3, 20)]
    result = nearest_expiries(date(2024, 2, 1), expiries, count=2)
    assert result == [date(2024, 2, 21), date(2024, 3, 20)]


def test_ladder_strikes_even_layers():
    strikes = ladder_strikes(0.055, 4, 0.0025)
    assert strikes == [0.05, 0.0525, 0.0575, 0.06]


def test_allocate_quantity_even_distribution():
    assert allocate_quantity(10, 4) == [3, 3, 2, 2]


def test_adjusted_limit_price_buy():
    assert adjusted_limit_price("BUY", 0.1, 0.002) == 0.102


def test_adjusted_limit_price_sell():
    assert adjusted_limit_price("SELL", 0.1, 0.002) == 0.098
