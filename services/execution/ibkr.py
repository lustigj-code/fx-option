"""IBKR connectivity helpers."""
from __future__ import annotations

import logging
from contextlib import AbstractAsyncContextManager
from dataclasses import dataclass
from typing import Callable, Optional

from ib_insync import IB, ConnectionError, Error, Trade

from .config import ExecutionConfig

logger = logging.getLogger(__name__)


@dataclass
class IBKRClient(AbstractAsyncContextManager["IBKRClient"]):
    """Wrapper around :class:`ib_insync.IB` with reconnect logic."""

    config: ExecutionConfig
    ib_factory: Callable[[], IB] = IB

    def __post_init__(self) -> None:
        self._ib: IB = self.ib_factory()
        self._connected: bool = False

    async def __aenter__(self) -> "IBKRClient":
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc, tb) -> Optional[bool]:
        await self.disconnect()
        return None

    async def connect(self) -> None:
        if self._connected:
            return
        conn = self.config.connection
        logger.info("Connecting to IBKR TWS %s:%s", conn.host, conn.port)
        try:
            await self._ib.connectAsync(
                conn.host,
                conn.port,
                clientId=conn.client_id,
                timeout=conn.connect_timeout,
            )
        except ConnectionError as exc:  # pragma: no cover - network failure path
            logger.error("IBKR connection failed: %s", exc)
            raise
        self._connected = True

    async def disconnect(self) -> None:
        if not self._connected:
            return
        logger.info("Disconnecting from IBKR")
        self._ib.disconnect()
        self._connected = False

    async def ensure_connection(self) -> None:
        if self._connected and self._ib.isConnected():
            return
        self._connected = False
        await self.connect()

    @property
    def ib(self) -> IB:
        return self._ib

    async def place_trade(self, contract, order) -> Trade:
        await self.ensure_connection()
        try:
            trade = self._ib.placeOrder(contract, order)
        except ConnectionError:
            logger.warning("IBKR placeOrder failed; reconnecting and retrying")
            self._connected = False
            await self.connect()
            trade = self._ib.placeOrder(contract, order)
        return trade

    async def qualify_contract(self, contract):
        await self.ensure_connection()
        try:
            qualified = await self._ib.qualifyContractsAsync(contract)
        except ConnectionError:
            logger.warning("IBKR contract qualification failed; reconnecting")
            self._connected = False
            await self.connect()
            qualified = await self._ib.qualifyContractsAsync(contract)
        if not qualified:
            raise RuntimeError("Contract qualification failed")
        return qualified[0]

    def add_error_handler(self, handler: Callable[[Error], None]) -> None:
        self._ib.errorEvent += handler

    def remove_error_handler(self, handler: Callable[[Error], None]) -> None:
        self._ib.errorEvent -= handler
