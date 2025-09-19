from datetime import date
from pathlib import Path

import pytest

from services.execution_sync.events import InMemoryEventEmitter
from services.execution_sync.ibkr import IBKRConfig
from services.execution_sync.models import HedgeRequest, OptionRight, OrderSide
from services.execution_sync.service import ExecutionService
from services.execution_sync.storage import OrderStorage


class DummyIBClient:
    def __init__(self) -> None:
        self.connected = False
        self.orders = []

    def ensure_connected(self) -> None:
        self.connected = True

    def execute_order(self, order):
        order.status = "Submitted"
        order.ib_order_id = (self.orders[-1].ib_order_id + 1) if self.orders else 1
        self.orders.append(order)
        return order


@pytest.fixture
def storage(tmp_path: Path) -> OrderStorage:
    return OrderStorage(tmp_path)


@pytest.fixture
def emitter() -> InMemoryEventEmitter:
    return InMemoryEventEmitter()


def test_execution_service_places_orders(storage: OrderStorage, emitter: InMemoryEventEmitter):
    config = IBKRConfig(account="DU123")
    client = DummyIBClient()
    service = ExecutionService(config, storage, emitter, ib_client=client)

    request = HedgeRequest(
        due_date=date(2024, 1, 15),
        quantity=6,
        side=OrderSide.BUY,
        strike=0.0525,
        right=OptionRight.CALL,
        limit_price=0.0015,
        slippage=0.0002,
        ladder_layers=2,
    )

    result = service.place_hedge(request)

    assert client.connected is True
    assert len(result.orders) == 4
    # Quantity 6 distributed across 4 orders -> [2,2,1,1]
    assert sorted(order.quantity for order in result.orders) == [1, 1, 2, 2]
    assert emitter.events, "HedgePlaced event should be emitted"


def test_execution_service_skips_zero_quantity(storage: OrderStorage, emitter: InMemoryEventEmitter):
    config = IBKRConfig()
    client = DummyIBClient()
    service = ExecutionService(config, storage, emitter, ib_client=client)

    request = HedgeRequest(
        due_date=date(2024, 1, 15),
        quantity=1,
        side=OrderSide.SELL,
        strike=0.05,
        right=OptionRight.PUT,
        limit_price=0.002,
        ladder_layers=3,
        expiry_count=2,
    )

    result = service.place_hedge(request)
    # 2 expiries * 3 strikes = 6 buckets. Quantity=1 so only first bucket non-zero.
    assert len(result.orders) == 1
    assert result.orders[0].quantity == 1
