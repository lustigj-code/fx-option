"""Order repository for PostgreSQL."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from services.database.models import Order as OrderModel


class OrderRepository:
    """Repository for order persistence operations."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db

    def create(
        self,
        user_id: str,
        currency_pair: str,
        side: str,
        quantity: int,
        strike: float,
        expiry: datetime,
        order_type: str = "LIMIT",
        limit_price: Optional[float] = None,
        quote_id: Optional[str] = None,
    ) -> OrderModel:
        """Create a new order."""
        order = OrderModel(
            id=str(uuid.uuid4()),
            quote_id=quote_id,
            user_id=user_id,
            currency_pair=currency_pair,
            side=side,
            quantity=quantity,
            strike=strike,
            expiry=expiry,
            limit_price=limit_price,
            order_type=order_type,
            status="pending",
            filled_quantity=0,
            fills=[],
        )

        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order

    def get_by_id(self, order_id: str) -> Optional[OrderModel]:
        """Get order by ID."""
        return self.db.query(OrderModel).filter(OrderModel.id == order_id).first()

    def get_by_ib_order_id(self, ib_order_id: int) -> Optional[OrderModel]:
        """Get order by Interactive Brokers order ID."""
        return self.db.query(OrderModel).filter(OrderModel.ib_order_id == ib_order_id).first()

    def get_by_user(self, user_id: str, status: Optional[str] = None) -> List[OrderModel]:
        """Get all orders for a user, optionally filtered by status."""
        query = self.db.query(OrderModel).filter(OrderModel.user_id == user_id)

        if status:
            query = query.filter(OrderModel.status == status)

        return query.order_by(OrderModel.created_at.desc()).all()

    def get_by_quote(self, quote_id: str) -> List[OrderModel]:
        """Get all orders associated with a quote."""
        return (
            self.db.query(OrderModel)
            .filter(OrderModel.quote_id == quote_id)
            .order_by(OrderModel.created_at.desc())
            .all()
        )

    def get_pending_orders(self, user_id: Optional[str] = None) -> List[OrderModel]:
        """Get all pending orders."""
        query = self.db.query(OrderModel).filter(
            OrderModel.status.in_(["pending", "submitted"])
        )

        if user_id:
            query = query.filter(OrderModel.user_id == user_id)

        return query.order_by(OrderModel.created_at.desc()).all()

    def get_filled_orders(self, user_id: Optional[str] = None, start_date: Optional[datetime] = None) -> List[OrderModel]:
        """Get all filled orders, optionally filtered by user and start date."""
        query = self.db.query(OrderModel).filter(OrderModel.status == "filled")

        if user_id:
            query = query.filter(OrderModel.user_id == user_id)

        if start_date:
            query = query.filter(OrderModel.filled_at >= start_date)

        return query.order_by(OrderModel.filled_at.desc()).all()

    def update_ib_order_id(self, order_id: str, ib_order_id: int, ib_contract_id: Optional[int] = None) -> Optional[OrderModel]:
        """Update order with IBKR order ID."""
        order = self.get_by_id(order_id)
        if not order:
            return None

        order.ib_order_id = ib_order_id
        if ib_contract_id:
            order.ib_contract_id = ib_contract_id

        self.db.commit()
        self.db.refresh(order)
        return order

    def update_status(
        self,
        order_id: str,
        status: str,
        submitted_at: Optional[datetime] = None,
        acknowledged_at: Optional[datetime] = None,
        filled_at: Optional[datetime] = None,
    ) -> Optional[OrderModel]:
        """Update order status and timestamps."""
        order = self.get_by_id(order_id)
        if not order:
            return None

        order.status = status

        if submitted_at:
            order.submitted_at = submitted_at
        if acknowledged_at:
            order.acknowledged_at = acknowledged_at
        if filled_at:
            order.filled_at = filled_at

        self.db.commit()
        self.db.refresh(order)
        return order

    def add_fill(
        self,
        order_id: str,
        price: float,
        quantity: int,
        timestamp: datetime,
        commission: Optional[float] = None,
    ) -> Optional[OrderModel]:
        """Add a fill to an order."""
        order = self.get_by_id(order_id)
        if not order:
            return None

        # Add fill to fills array
        fill_data = {
            "price": float(price),
            "quantity": quantity,
            "timestamp": timestamp.isoformat(),
        }
        if commission is not None:
            fill_data["commission"] = float(commission)

        if order.fills is None:
            order.fills = []
        order.fills.append(fill_data)

        # Update filled quantity
        order.filled_quantity = (order.filled_quantity or 0) + quantity

        # Calculate average fill price
        total_quantity = 0
        weighted_sum = 0.0
        for fill in order.fills:
            qty = fill["quantity"]
            total_quantity += qty
            weighted_sum += fill["price"] * qty

        if total_quantity > 0:
            order.average_fill_price = weighted_sum / total_quantity

        # Update total commission
        if commission is not None:
            order.commission = (order.commission or 0) + commission

        # Check if fully filled
        if order.filled_quantity >= order.quantity:
            order.status = "filled"
            order.filled_at = timestamp

        self.db.commit()
        self.db.refresh(order)
        return order

    def cancel_order(self, order_id: str) -> Optional[OrderModel]:
        """Cancel an order."""
        return self.update_status(order_id, "cancelled")

    def reject_order(self, order_id: str, reason: str) -> Optional[OrderModel]:
        """Mark an order as rejected."""
        order = self.get_by_id(order_id)
        if not order:
            return None

        order.status = "rejected"
        order.rejection_reason = reason
        self.db.commit()
        self.db.refresh(order)
        return order

    def delete(self, order_id: str) -> bool:
        """Delete an order by ID."""
        order = self.get_by_id(order_id)
        if not order:
            return False

        self.db.delete(order)
        self.db.commit()
        return True

    def list_all(self, limit: int = 100, offset: int = 0) -> List[OrderModel]:
        """List all orders with pagination."""
        return (
            self.db.query(OrderModel)
            .order_by(OrderModel.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    def count_by_status(self, status: str) -> int:
        """Count orders by status."""
        return self.db.query(OrderModel).filter(OrderModel.status == status).count()

    def get_orders_by_currency_pair(
        self,
        currency_pair: str,
        status: Optional[str] = None,
    ) -> List[OrderModel]:
        """Get orders for a specific currency pair."""
        query = self.db.query(OrderModel).filter(OrderModel.currency_pair == currency_pair)

        if status:
            query = query.filter(OrderModel.status == status)

        return query.order_by(OrderModel.created_at.desc()).all()
