"""Exposure repository for PostgreSQL."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from services.database.models import Exposure as ExposureModel


class ExposureRepository:
    """Repository for exposure persistence operations."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db

    def create(
        self,
        user_id: str,
        source: str,
        currency_pair: str,
        notional: float,
        currency: str,
        due_date: datetime,
        external_id: Optional[str] = None,
        counterparty: Optional[str] = None,
        extra_data: Optional[dict] = None,
    ) -> ExposureModel:
        """Create a new exposure."""
        exposure = ExposureModel(
            id=str(uuid.uuid4()),
            user_id=user_id,
            source=source,
            external_id=external_id,
            currency_pair=currency_pair,
            notional=notional,
            currency=currency,
            due_date=due_date,
            counterparty=counterparty,
            status="active",
            extra_data=extra_data or {},
        )

        self.db.add(exposure)
        self.db.commit()
        self.db.refresh(exposure)
        return exposure

    def get_by_id(self, exposure_id: str) -> Optional[ExposureModel]:
        """Get exposure by ID."""
        return self.db.query(ExposureModel).filter(ExposureModel.id == exposure_id).first()

    def get_by_external_id(self, source: str, external_id: str) -> Optional[ExposureModel]:
        """Get exposure by external system ID (e.g., QBO invoice ID)."""
        return (
            self.db.query(ExposureModel)
            .filter(and_(ExposureModel.source == source, ExposureModel.external_id == external_id))
            .first()
        )

    def get_by_user(self, user_id: str, status: Optional[str] = None) -> List[ExposureModel]:
        """Get all exposures for a user, optionally filtered by status."""
        query = self.db.query(ExposureModel).filter(ExposureModel.user_id == user_id)

        if status:
            query = query.filter(ExposureModel.status == status)

        return query.order_by(ExposureModel.due_date.asc()).all()

    def get_active_exposures(
        self,
        user_id: Optional[str] = None,
        currency_pair: Optional[str] = None,
    ) -> List[ExposureModel]:
        """Get all active exposures, optionally filtered by user and currency pair."""
        query = self.db.query(ExposureModel).filter(ExposureModel.status == "active")

        if user_id:
            query = query.filter(ExposureModel.user_id == user_id)

        if currency_pair:
            query = query.filter(ExposureModel.currency_pair == currency_pair)

        return query.order_by(ExposureModel.due_date.asc()).all()

    def get_unhedged_exposures(self, user_id: Optional[str] = None) -> List[ExposureModel]:
        """Get exposures that haven't been hedged yet."""
        # This would need to join with quotes/orders to determine if hedged
        # For now, just return active exposures
        return self.get_active_exposures(user_id=user_id)

    def update_status(self, exposure_id: str, status: str) -> Optional[ExposureModel]:
        """Update exposure status."""
        exposure = self.get_by_id(exposure_id)
        if not exposure:
            return None

        exposure.status = status
        self.db.commit()
        self.db.refresh(exposure)
        return exposure

    def mark_as_hedged(self, exposure_id: str) -> Optional[ExposureModel]:
        """Mark exposure as hedged."""
        return self.update_status(exposure_id, "hedged")

    def cancel_exposure(self, exposure_id: str) -> Optional[ExposureModel]:
        """Cancel an exposure."""
        return self.update_status(exposure_id, "cancelled")

    def expire_old_exposures(self, days_past_due: int = 30) -> int:
        """Expire exposures that are past their due date. Returns count."""
        cutoff_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

        result = (
            self.db.query(ExposureModel)
            .filter(and_(ExposureModel.status == "active", ExposureModel.due_date < cutoff_date))
            .update({"status": "expired"})
        )
        self.db.commit()
        return result

    def delete(self, exposure_id: str) -> bool:
        """Delete an exposure by ID."""
        exposure = self.get_by_id(exposure_id)
        if not exposure:
            return False

        self.db.delete(exposure)
        self.db.commit()
        return True

    def list_all(self, limit: int = 100, offset: int = 0) -> List[ExposureModel]:
        """List all exposures with pagination."""
        return (
            self.db.query(ExposureModel)
            .order_by(ExposureModel.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    def get_by_currency_pair(self, currency_pair: str, status: Optional[str] = None) -> List[ExposureModel]:
        """Get exposures for a specific currency pair."""
        query = self.db.query(ExposureModel).filter(ExposureModel.currency_pair == currency_pair)

        if status:
            query = query.filter(ExposureModel.status == status)

        return query.order_by(ExposureModel.due_date.asc()).all()

    def count_by_status(self, status: str) -> int:
        """Count exposures by status."""
        return self.db.query(ExposureModel).filter(ExposureModel.status == status).count()
