"""Gateway service exposing execution endpoints."""
from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Literal, Tuple
from uuid import uuid4

from services.execution_sync.models import HedgeOrder as CoreHedgeOrder
from services.execution_sync.models import HedgeRequest as CoreHedgeRequest
from services.execution_sync.models import HedgeResult as CoreHedgeResult


ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_STORAGE_DIR = ROOT_DIR / "data" / "execution"


class ValidationError(Exception):
    """Raised when an incoming request fails validation."""

    def __init__(self, errors: List[str]):
        super().__init__("; ".join(errors))
        self.errors = errors


class HedgeRequest:
    """Incoming request payload for the hedge execution endpoint."""

    __slots__ = ("strategy_id", "instrument", "side", "notional", "base_price", "levels", "price_increment")

    def __init__(
        self,
        strategy_id: str,
        instrument: str,
        side: Literal["BUY", "SELL"],
        notional: float,
        base_price: float,
        levels: int,
        price_increment: float,
    ) -> None:
        self.strategy_id = strategy_id
        self.instrument = instrument
        self.side = side
        self.notional = notional
        self.base_price = base_price
        self.levels = levels
        self.price_increment = price_increment

    @classmethod
    def validate(cls, payload: Dict[str, object]) -> "HedgeRequest":
        errors: List[str] = []

        def require(field: str) -> object:
            if field not in payload:
                errors.append(f"Missing required field: {field}")
                return None
            return payload[field]

        strategy_id = require("strategy_id")
        instrument = require("instrument")
        side = require("side")
        notional = require("notional")
        base_price = require("base_price")
        levels = require("levels")
        price_increment = require("price_increment")

        if isinstance(side, str):
            side_value = side.upper()
            if side_value not in {"BUY", "SELL"}:
                errors.append("side must be either 'BUY' or 'SELL'")
        else:
            errors.append("side must be a string")
            side_value = "BUY"

        def positive_number(value: object, field: str) -> float:
            if not isinstance(value, (int, float)):
                errors.append(f"{field} must be a number")
                return 0.0
            if value <= 0:
                errors.append(f"{field} must be greater than zero")
            return float(value)

        def positive_int(value: object, field: str) -> int:
            if not isinstance(value, int):
                errors.append(f"{field} must be an integer")
                return 0
            if value <= 0:
                errors.append(f"{field} must be greater than zero")
            return int(value)

        if not isinstance(strategy_id, str) or not strategy_id:
            errors.append("strategy_id must be a non-empty string")
        if not isinstance(instrument, str) or not instrument:
            errors.append("instrument must be a non-empty string")

        notional_value = positive_number(notional, "notional")
        base_price_value = positive_number(base_price, "base_price")
        price_increment_value = positive_number(price_increment, "price_increment")
        levels_value = positive_int(levels, "levels")

        if errors:
            raise ValidationError(errors)

        return cls(
            strategy_id=strategy_id,
            instrument=instrument,
            side=side_value,  # type: ignore[arg-type]
            notional=notional_value,
            base_price=base_price_value,
            levels=levels_value,
            price_increment=price_increment_value,
        )

    def to_core(self) -> CoreHedgeRequest:
        return CoreHedgeRequest(
            strategy_id=self.strategy_id,
            instrument=self.instrument,
            side=self.side,
            notional=self.notional,
            base_price=self.base_price,
            levels=self.levels,
            price_increment=self.price_increment,
        )


class HedgeOrder:
    """Representation of a single laddered order leg."""

    def __init__(self, order: CoreHedgeOrder) -> None:
        self.leg_id = order.leg_id
        self.quantity = order.quantity
        self.limit_price = order.limit_price
        self.status = order.status
        self.broker_reference = order.broker_reference

    def to_dict(self) -> Dict[str, object]:
        return {
            "leg_id": self.leg_id,
            "quantity": self.quantity,
            "limit_price": self.limit_price,
            "status": self.status,
            "broker_reference": self.broker_reference,
        }


class HedgeResult:
    """Response payload returned to gateway clients."""

    def __init__(self, result: CoreHedgeResult) -> None:
        self.request_id = result.request_id
        self.status = result.status
        self.orders = [HedgeOrder(order) for order in result.orders]

    def to_dict(self) -> Dict[str, object]:
        return {
            "request_id": self.request_id,
            "status": self.status,
            "orders": [order.to_dict() for order in self.orders],
        }


class DryRunIBKRClient:
    """Simulated IBKR client used for gateway dry-run submissions."""

    def __init__(self, reference_prefix: str = "DRY") -> None:
        self.reference_prefix = reference_prefix

    def place_order(self, order: CoreHedgeOrder) -> CoreHedgeOrder:
        return CoreHedgeOrder(
            leg_id=order.leg_id,
            quantity=order.quantity,
            limit_price=order.limit_price,
            status="submitted",
            broker_reference=f"{self.reference_prefix}-{uuid4().hex[:8]}",
        )


class ExecutionService:
    """Application service coordinating hedge order submission."""

    def __init__(self, storage_dir: Path | None = None, ibkr_client: DryRunIBKRClient | None = None) -> None:
        self.storage_dir = storage_dir or DEFAULT_STORAGE_DIR
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.ibkr_client = ibkr_client or DryRunIBKRClient()

    def submit(self, request: CoreHedgeRequest) -> CoreHedgeResult:
        orders = self._build_ladder(request)
        result = CoreHedgeResult(request_id=str(uuid4()), status="submitted", orders=orders)
        self._persist(request, result)
        return result

    def _build_ladder(self, request: CoreHedgeRequest) -> List[CoreHedgeOrder]:
        direction = 1 if request.side == "BUY" else -1
        quantity_per_level = round(request.notional / request.levels / request.base_price, 6)
        orders: List[CoreHedgeOrder] = []

        for level in range(request.levels):
            price_offset = direction * request.price_increment * level
            limit_price = round(request.base_price + price_offset, 6)
            leg = CoreHedgeOrder(
                leg_id=f"{request.strategy_id}-{level + 1}",
                quantity=quantity_per_level,
                limit_price=limit_price,
            )
            orders.append(self.ibkr_client.place_order(leg))

        return orders

    def _persist(self, request: CoreHedgeRequest, result: CoreHedgeResult) -> None:
        timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S%f")
        target = self.storage_dir / f"{timestamp}_{result.request_id}.json"
        payload = {
            "request": self._serialise_request(request),
            "result": self._serialise_result(result),
        }
        target.write_text(json.dumps(payload, indent=2))

    @staticmethod
    def _serialise_request(request: CoreHedgeRequest) -> Dict[str, object]:
        data = asdict(request)
        data["timestamp"] = request.timestamp.isoformat()
        return data

    @staticmethod
    def _serialise_result(result: CoreHedgeResult) -> Dict[str, object]:
        serialised = {
            "request_id": result.request_id,
            "status": result.status,
            "created_at": result.created_at.isoformat(),
            "orders": [],
        }
        for order in result.orders:
            serialised["orders"].append(
                {
                    "leg_id": order.leg_id,
                    "quantity": order.quantity,
                    "limit_price": order.limit_price,
                    "status": order.status,
                    "broker_reference": order.broker_reference,
                }
            )
        return serialised


class Response:
    """Simple response object mimicking HTTP semantics for tests."""

    def __init__(self, status_code: int, payload: Dict[str, object]) -> None:
        self.status_code = status_code
        self._payload = payload

    def json(self) -> Dict[str, object]:
        return self._payload


class GatewayApp:
    """Minimal in-process application exposing execution endpoints."""

    def __init__(self, execution_service: ExecutionService | None = None) -> None:
        self.execution_service = execution_service or ExecutionService()
        self.routes: Dict[Tuple[str, str], callable] = {}
        self.add_route("POST", "/api/execution/orders", self.create_execution_orders)

    def add_route(self, method: str, path: str, handler: callable) -> None:
        self.routes[(method.upper(), path)] = handler

    def handle(self, method: str, path: str, payload: Dict[str, object]) -> Response:
        route = self.routes.get((method.upper(), path))
        if route is None:
            raise ValueError(f"No route registered for {method} {path}")
        return route(payload)

    def create_execution_orders(self, payload: Dict[str, object]) -> Response:
        try:
            request = HedgeRequest.validate(payload)
        except ValidationError as exc:
            return Response(status_code=422, payload={"detail": exc.errors})

        result = self.execution_service.submit(request.to_core())
        return Response(status_code=200, payload=HedgeResult(result).to_dict())


app = GatewayApp()
execution_service = app.execution_service
