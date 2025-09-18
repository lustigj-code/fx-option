"""Configuration models for the execution service."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import timedelta
from pathlib import Path
from typing import Optional


@dataclass(slots=True)
class IBKRConnectionConfig:
    """Settings required to establish a connection to IBKR TWS/Gateway."""

    host: str = "127.0.0.1"
    port: int = 7497  # Paper trading default
    client_id: int = 116
    connect_timeout: float = 5.0
    reconnect_interval: timedelta = timedelta(seconds=5)
    max_reconnect_attempts: Optional[int] = None


@dataclass(slots=True)
class ExecutionPaths:
    """Filesystem paths used by the execution service."""

    base_dir: Path = Path("./runtime")
    orders_file: Path = field(init=False)
    fills_file: Path = field(init=False)

    def __post_init__(self) -> None:
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.orders_file = self.base_dir / "orders.jsonl"
        self.fills_file = self.base_dir / "fills.jsonl"


@dataclass(slots=True)
class ExecutionConfig:
    """Aggregate configuration for the execution service."""

    account: str
    slippage: float = 0.0005
    connection: IBKRConnectionConfig = field(default_factory=IBKRConnectionConfig)
    paths: ExecutionPaths = field(default_factory=ExecutionPaths)
