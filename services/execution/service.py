"""High level execution workflow for MXN option hedges."""
from __future__ import annotations

import asyncio
import logging
from typing import List

from ib_insync import Error, Trade

from .config import ExecutionConfig
from .contracts import MXNOptionSpec, build_option_contract
from .due_date import map_due_date_to_expiries
from .events import EventEmitter, HedgePlaced
from .ibkr import IBKRClient
from .orders import (
    HedgeFill,
    HedgeOrder,
    HedgeRequest,
    allocate_ladder,
    build_limit_order,
)
from .repository import JsonLineRepository

logger = logging.getLogger(__name__)


class ExecutionService:
    """Service responsible for turning hedge intents into IB orders."""

    def __init__(
        self,
        config: ExecutionConfig,
        event_emitter: EventEmitter,
        ib_client: IBKRClient,
    ) -> None:
        self.config = config
        self.event_emitter = event_emitter
        self.ib_client = ib_client
        self.orders_repo = JsonLineRepository(config.paths.orders_file)
        self.fills_repo = JsonLineRepository(config.paths.fills_file)
        self._error_handler = self._on_ib_error
        self._watchers: set[asyncio.Task[None]] = set()

    async def __aenter__(self) -> "ExecutionService":
        await self.ib_client.connect()
        self.ib_client.add_error_handler(self._error_handler)
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        self.ib_client.remove_error_handler(self._error_handler)
        if self._watchers:
            await asyncio.gather(*self._watchers, return_exceptions=True)
            self._watchers.clear()
        await self.ib_client.disconnect()

    async def place_hedge(self, request: HedgeRequest) -> List[Trade]:
        """Place hedge orders for the provided request."""

        action = request.normalized_action()
        right = request.normalized_right()
        due_date = request.normalized_due_date()
        expiries = map_due_date_to_expiries(due_date.date(), request.ladder_depth)
        if request.quantity <= 0:
            raise ValueError("quantity must be positive")
        allocations = allocate_ladder(request.quantity, len(expiries))

        slippage = request.max_slippage or self.config.slippage
        reference_price = request.reference_price

        trades: List[Trade] = []
        for expiry, qty in zip(expiries, allocations):
            if qty == 0:
                continue
            limit_price = self._apply_slippage(action, reference_price, slippage)
            contract = build_option_contract(expiry, MXNOptionSpec(request.strike, right))
            contract = await self.ib_client.qualify_contract(contract)
            order = build_limit_order(action, qty, limit_price)
            trade = await self.ib_client.place_trade(contract, order)
            self._register_trade(trade, expiry, limit_price, request, right)
            trades.append(trade)

        return trades

    def _apply_slippage(self, action: str, reference_price: float, slippage: float) -> float:
        slippage = max(slippage, 0.0)
        if action == "BUY":
            return round(reference_price + slippage, 6)
        return round(max(reference_price - slippage, 0.0), 6)

    def _register_trade(
        self,
        trade: Trade,
        expiry: str,
        limit_price: float,
        request: HedgeRequest,
        right: str,
    ) -> None:
        order = trade.order
        hedge_order = HedgeOrder(
            ib_order_id=order.orderId,
            perm_id=order.permId,
            account=self.config.account,
            action=order.action,
            quantity=order.totalQuantity,
            limit_price=limit_price,
            expiry=expiry,
            strike=request.strike,
            right=right,
        )
        self.orders_repo.append(hedge_order)
        self.event_emitter.emit(HedgePlaced(order=hedge_order))

        task = asyncio.create_task(self._watch_trade(trade))
        self._watchers.add(task)
        task.add_done_callback(self._watchers.discard)

    async def _watch_trade(self, trade: Trade) -> None:
        """Watch order updates and persist fills."""

        try:
            while not trade.isDone():
                await trade.updateEvent
                self._record_fill(trade)
            # Ensure the terminal state is captured as well.
            self._record_fill(trade)
            logger.info(
                "Order %s completed with status %s",
                trade.order.orderId,
                trade.orderStatus.status,
            )
        except Exception:  # pragma: no cover - defensive logging
            logger.exception("Failed to watch trade %s", trade.order.orderId)

    def _record_fill(self, trade: Trade) -> None:
        status = trade.orderStatus
        fill_details = trade.fills[-1] if trade.fills else None
        fill_price = fill_details.execution.price if fill_details else 0.0
        hedge_fill = HedgeFill(
            ib_order_id=trade.order.orderId,
            fill_price=fill_price,
            filled=status.filled,
            remaining=status.remaining,
            status=status.status,
            last_liquidity=getattr(status, "lastLiquidity", None),
        )
        self.fills_repo.append(hedge_fill)

    def _on_ib_error(self, error: Error) -> None:
        if error.errorCode in {2103, 2104}:  # data farm warnings
            logger.warning("IBKR data farm status: %s", error.errorCode)
            return
        logger.error("IBKR error %s: %s", error.errorCode, error.errorMsg)
