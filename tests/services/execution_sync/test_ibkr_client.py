from datetime import date

import pytest

from services.execution_sync.ibkr import IBKRConfig, IBKRExecutionClient, LimitOrder, Trade
from services.execution_sync.models import HedgeOrder, OptionRight, OrderSide


class FakeIB:
    def __init__(self) -> None:
        self.connected = False
        self.connect_calls = 0
        self.placed_orders = []

    def isConnected(self) -> bool:
        return self.connected

    def connect(self, host: str, port: int, clientId: int) -> None:
        self.connect_calls += 1
        if self.connect_calls < 2:
            raise RuntimeError("connection failed")
        self.connected = True

    def placeOrder(self, contract, order):
        trade = Trade()
        trade.order.orderId = len(self.placed_orders) + 1
        trade.orderStatus.status = "Submitted"
        self.placed_orders.append((contract, order))
        return trade


def test_ensure_connected_retries():
    client = IBKRExecutionClient(IBKRConfig(max_retries=3, reconnect_delay=0), ib=FakeIB())
    client.ensure_connected()
    assert client.ib.connect_calls == 2
    assert client.ib.connected is True


def test_execute_order_updates_order_details():
    fake_ib = FakeIB()
    fake_ib.connected = True
    client = IBKRExecutionClient(IBKRConfig(account="DU123"), ib=fake_ib)

    order = HedgeOrder(
        contract_month=date(2024, 2, 21),
        strike=0.055,
        right=OptionRight.CALL,
        quantity=3,
        side=OrderSide.BUY,
        limit_price=0.0012,
    )

    result = client.execute_order(order)
    assert result.ib_order_id == 1
    assert result.status == "Submitted"
    contract, limit_order = fake_ib.placed_orders[0]
    assert limit_order.account == "DU123"
    assert limit_order.lmtPrice == pytest.approx(0.0012)
    assert contract.params["lastTradeDateOrContractMonth"] == "20240221"
