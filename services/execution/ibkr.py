"""IBKR client wrapper used by the execution service."""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Any, Optional

try:  # pragma: no cover - import is validated in integration tests
    from ib_insync import IB, FutureOption, LimitOrder, Trade
except Exception:  # pragma: no cover - fallback for environments without ib_insync
    class FutureOption:  # type: ignore
        def __init__(self, **kwargs: Any) -> None:
            self.params = kwargs

    class LimitOrder:  # type: ignore
        def __init__(self, action: str, quantity: int, limit_price: float) -> None:
            self.action = action
            self.totalQuantity = quantity
            self.lmtPrice = limit_price
            self.account: Optional[str] = None

    class Trade:  # type: ignore
        def __init__(self) -> None:
            self.order = type("Order", (), {"orderId": None})()
            self.orderStatus = type("Status", (), {"status": "Submitted"})()
            self.fills: list[Any] = []

    class IB:  # type: ignore
        def __init__(self) -> None:
            self._connected = False

        def isConnected(self) -> bool:
            return self._connected

        def connect(self, host: str, port: int, clientId: int) -> None:
            self._connected = True

        def placeOrder(self, contract: FutureOption, order: LimitOrder) -> Trade:
            trade = Trade()
            trade.order.orderId = 1
            trade.contract = contract
            trade.orderSubmitted = order
            return trade

from .models import HedgeOrder, OptionRight, OrderSide
LOGGER = logging.getLogger(__name__)


@dataclass
class IBKRConfig:
    host: str = "127.0.0.1"
    port: int = 7497
    client_id: int = 1
    account: Optional[str] = None
    reconnect_delay: float = 2.0
    max_retries: int = 5


class IBKRExecutionClient:
    """Handles connectivity to IBKR and order placement."""

    def __init__(self, config: IBKRConfig, ib: Optional[IB] = None) -> None:
        self.config = config
        self.ib = ib or IB()

    def ensure_connected(self) -> None:
        if getattr(self.ib, "isConnected", lambda: False)():
            return
        retries = 0
        while retries <= self.config.max_retries:
            try:
                LOGGER.info("Connecting to IBKR TWS host=%s port=%s client_id=%s", self.config.host, self.config.port, self.config.client_id)
                self.ib.connect(self.config.host, self.config.port, clientId=self.config.client_id)
                return
            except Exception as exc:  # pragma: no cover - network failure branch
                retries += 1
                LOGGER.warning("Failed to connect to IBKR (attempt %s/%s): %s", retries, self.config.max_retries, exc)
                time.sleep(self.config.reconnect_delay)
        raise ConnectionError("Unable to connect to IBKR after multiple retries")

    def build_contract(self, contract_month: str, strike: float, right: OptionRight) -> FutureOption:
        return FutureOption(
            symbol="6M",
            lastTradeDateOrContractMonth=contract_month,
            strike=strike,
            right=right.value,
            exchange="GLOBEX",
            multiplier="500000",
        )

    def place_limit_order(self, contract: FutureOption, side: OrderSide, quantity: int, limit_price: float) -> Trade:
        order_side = "BUY" if side is OrderSide.BUY else "SELL"
        order = LimitOrder(order_side, quantity, limit_price)
        if self.config.account:
            order.account = self.config.account
        return self.ib.placeOrder(contract, order)

    def execute_order(self, order: HedgeOrder) -> HedgeOrder:
        contract_month = order.contract_month.strftime("%Y%m%d")
        contract = self.build_contract(contract_month, order.strike, order.right)
        trade = self.place_limit_order(contract, order.side, order.quantity, order.limit_price)
        order.ib_order_id = getattr(trade, "order", getattr(trade, "orderStatus", None)).orderId if hasattr(trade, "order") else None
        order.status = getattr(trade, "orderStatus", None).status if hasattr(trade, "orderStatus") else order.status
        if hasattr(trade, "log"):
            fills = []
            for fill in getattr(trade, "fills", []):
                fills.append(
                    {
                        "price": getattr(fill.execution, "price", None),
                        "qty": getattr(fill.execution, "shares", None),
                        "time": getattr(fill.execution, "time", None),
                    }
                )
            order.fills = fills
        return order
