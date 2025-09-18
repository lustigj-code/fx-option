"""High level execution service for MXN options."""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import List

from .events import EventEmitter
from .ibkr import IBKRConfig, IBKRExecutionClient
from .models import HedgeOrder, HedgePlacedEvent, HedgeRequest, HedgeResult, OptionRight, OrderSide
from .storage import OrderStorage
from .utils import allocate_quantity, ladder_strikes, monthly_expiries, nearest_expiries, adjusted_limit_price


class ExecutionService:
    """Coordinates order construction, submission, and persistence."""

    def __init__(
        self,
        ib_config: IBKRConfig,
        storage: OrderStorage,
        emitter: EventEmitter,
        *,
        ib_client: IBKRExecutionClient | None = None,
    ) -> None:
        self._storage = storage
        self._emitter = emitter
        self._client = ib_client or IBKRExecutionClient(ib_config)
        self._ib_config = ib_config

    def _build_orders(self, request: HedgeRequest) -> List[HedgeOrder]:
        expiries = nearest_expiries(
            request.due_date,
            monthly_expiries(request.due_date, months_ahead=12),
            count=request.expiry_count,
        )
        strikes = ladder_strikes(request.strike, request.ladder_layers, request.strike_step)
        total_orders = len(expiries) * len(strikes)
        quantities = allocate_quantity(request.quantity, total_orders)

        orders: List[HedgeOrder] = []
        index = 0
        for expiry in expiries:
            for strike in strikes:
                qty = quantities[index]
                index += 1
                if qty == 0:
                    continue
                limit = adjusted_limit_price(request.side.value, request.limit_price, request.slippage)
                orders.append(
                    HedgeOrder(
                        contract_month=expiry,
                        strike=strike,
                        right=request.right,
                        quantity=qty,
                        side=request.side,
                        limit_price=limit,
                        client_order_id=request.client_order_id,
                        account=request.account or self._ib_config.account,
                    )
                )
        return orders

    def place_hedge(self, request: HedgeRequest) -> HedgeResult:
        orders = self._build_orders(request)
        self._client.ensure_connected()

        executed: List[HedgeOrder] = []
        for order in orders:
            executed_order = self._client.execute_order(order)
            self._storage.record_order(executed_order)
            if executed_order.fills:
                self._storage.record_fills(executed_order)
            executed.append(executed_order)

        result = HedgeResult(orders=executed)
        event = HedgePlacedEvent(timestamp=datetime.now(timezone.utc), request=request, result=result)
        self._emitter.emit(event)
        return result
