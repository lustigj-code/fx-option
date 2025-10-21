"""Quote repository for PostgreSQL."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from services.database.models import Quote as QuoteModel


class QuoteRepository:
    """Repository for quote persistence operations."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db

    def create(
        self,
        exposure_id: str,
        user_id: str,
        currency_pair: str,
        notional: float,
        strike: float,
        premium: float,
        spot_rate: float,
        volatility: float,
        interest_rate_domestic: float,
        interest_rate_foreign: float,
        time_to_expiry_years: float,
        option_type: str,
        valid_until: datetime,
    ) -> QuoteModel:
        """Create a new quote."""
        quote = QuoteModel(
            id=str(uuid.uuid4()),
            exposure_id=exposure_id,
            user_id=user_id,
            currency_pair=currency_pair,
            notional=notional,
            strike=strike,
            premium=premium,
            spot_rate=spot_rate,
            volatility=volatility,
            interest_rate_domestic=interest_rate_domestic,
            interest_rate_foreign=interest_rate_foreign,
            time_to_expiry_years=time_to_expiry_years,
            option_type=option_type,
            status="active",
            valid_until=valid_until,
        )

        self.db.add(quote)
        self.db.commit()
        self.db.refresh(quote)
        return quote

    def get_by_id(self, quote_id: str) -> Optional[QuoteModel]:
        """Get quote by ID."""
        return self.db.query(QuoteModel).filter(QuoteModel.id == quote_id).first()

    def get_by_exposure_id(self, exposure_id: str) -> Optional[QuoteModel]:
        """Get the most recent quote for an exposure."""
        return (
            self.db.query(QuoteModel)
            .filter(QuoteModel.exposure_id == exposure_id)
            .order_by(QuoteModel.created_at.desc())
            .first()
        )

    def get_by_user(self, user_id: str, status: Optional[str] = None) -> List[QuoteModel]:
        """Get all quotes for a user, optionally filtered by status."""
        query = self.db.query(QuoteModel).filter(QuoteModel.user_id == user_id)

        if status:
            query = query.filter(QuoteModel.status == status)

        return query.order_by(QuoteModel.created_at.desc()).all()

    def get_active_quotes(self, user_id: Optional[str] = None) -> List[QuoteModel]:
        """Get all active (non-expired) quotes."""
        now = datetime.now(timezone.utc)
        query = self.db.query(QuoteModel).filter(
            and_(QuoteModel.status == "active", QuoteModel.valid_until > now)
        )

        if user_id:
            query = query.filter(QuoteModel.user_id == user_id)

        return query.order_by(QuoteModel.created_at.desc()).all()

    def accept_quote(self, quote_id: str) -> Optional[QuoteModel]:
        """Mark a quote as accepted."""
        quote = self.get_by_id(quote_id)
        if not quote:
            return None

        # Verify quote is still valid
        now = datetime.now(timezone.utc)
        if quote.valid_until <= now:
            quote.status = "expired"
            self.db.commit()
            return None

        quote.status = "accepted"
        quote.accepted_at = now
        self.db.commit()
        self.db.refresh(quote)
        return quote

    def reject_quote(self, quote_id: str) -> Optional[QuoteModel]:
        """Mark a quote as rejected."""
        quote = self.get_by_id(quote_id)
        if not quote:
            return None

        quote.status = "rejected"
        self.db.commit()
        self.db.refresh(quote)
        return quote

    def expire_old_quotes(self) -> int:
        """Expire all quotes past their validity window. Returns count of expired quotes."""
        now = datetime.now(timezone.utc)
        result = (
            self.db.query(QuoteModel)
            .filter(and_(QuoteModel.status == "active", QuoteModel.valid_until <= now))
            .update({"status": "expired"})
        )
        self.db.commit()
        return result

    def delete(self, quote_id: str) -> bool:
        """Delete a quote by ID."""
        quote = self.get_by_id(quote_id)
        if not quote:
            return False

        self.db.delete(quote)
        self.db.commit()
        return True

    def list_all(self, limit: int = 100, offset: int = 0) -> List[QuoteModel]:
        """List all quotes with pagination."""
        return (
            self.db.query(QuoteModel)
            .order_by(QuoteModel.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    def count_by_status(self, status: str) -> int:
        """Count quotes by status."""
        return self.db.query(QuoteModel).filter(QuoteModel.status == status).count()
