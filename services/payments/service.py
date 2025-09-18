"""Domain service layer for payments orchestration built on sqlite3."""
from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import Optional

from .database import db_transaction
from .models import Payment, PaymentStatus, Payout, PayoutStatus
from .providers.registry import get_collect_provider, get_payout_provider
from .queue import publish_payment_settled
from .schemas import CollectRequest, CollectResponse, PaymentSettledEvent, PayoutRequest, PayoutResponse


def _now() -> datetime:
    return datetime.now(tz=UTC)


def _serialize_amount(amount: Decimal) -> str:
    return format(amount, "f")


def _deserialize_amount(value: str) -> Decimal:
    return Decimal(value)


def _row_to_payment(row) -> Payment:
    return Payment(
        id=row["id"],
        provider=row["provider"],
        amount=_deserialize_amount(row["amount"]),
        currency=row["currency"],
        status=PaymentStatus(row["status"]),
        customer_meta=json.loads(row["customer_meta"]) if row["customer_meta"] else {},
        checkout_link=row["checkout_link"],
        bank_debit_intent=row["bank_debit_intent"],
        idempotency_key=row["idempotency_key"],
        external_reference=row["external_reference"],
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


def _row_to_payout(row) -> Payout:
    return Payout(
        id=row["id"],
        amount=_deserialize_amount(row["amount"]),
        currency=row["currency"],
        status=PayoutStatus(row["status"]),
        beneficiary_id=row["beneficiary_id"],
        idempotency_key=row["idempotency_key"],
        external_reference=row["external_reference"],
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


def _insert_fee_breakdown(conn, payment_id: str, provider: str) -> None:
    conn.execute(
        "INSERT INTO fee_breakdown (id, payment_id, description, amount) VALUES (?, ?, ?, ?)",
        (str(uuid.uuid4()), payment_id, f"{provider} fee", _serialize_amount(Decimal("0.30"))),
    )


def create_collect(request: CollectRequest, idempotency_key: Optional[str]) -> CollectResponse:
    with db_transaction() as conn:
        if idempotency_key:
            row = conn.execute(
                "SELECT * FROM payments WHERE idempotency_key = ?", (idempotency_key,)
            ).fetchone()
            if row:
                payment = _row_to_payment(row)
                return CollectResponse(
                    payment_id=payment.id,
                    provider=payment.provider,
                    status=payment.status,
                    checkout_link=payment.checkout_link,
                    bank_debit_intent=payment.bank_debit_intent,
                )

        provider = get_collect_provider(request.currency)
        result = provider.create_collect(request.amount, request.currency, request.customer_meta)

        payment_id = str(uuid.uuid4())
        now = _now().isoformat()
        conn.execute(
            """
            INSERT INTO payments (
                id, provider, amount, currency, status, customer_meta, checkout_link,
                bank_debit_intent, idempotency_key, external_reference, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payment_id,
                result.provider,
                _serialize_amount(request.amount),
                request.currency.upper(),
                PaymentStatus.pending.value,
                json.dumps(request.customer_meta),
                result.checkout_link,
                result.bank_debit_intent,
                idempotency_key,
                result.external_reference,
                now,
                now,
            ),
        )
        _insert_fee_breakdown(conn, payment_id, result.provider)

        return CollectResponse(
            payment_id=payment_id,
            provider=result.provider,
            status=PaymentStatus.pending,
            checkout_link=result.checkout_link,
            bank_debit_intent=result.bank_debit_intent,
        )


def create_payout(request: PayoutRequest, idempotency_key: Optional[str]) -> PayoutResponse:
    with db_transaction() as conn:
        if idempotency_key:
            row = conn.execute(
                "SELECT * FROM payouts WHERE idempotency_key = ?", (idempotency_key,)
            ).fetchone()
            if row:
                payout = _row_to_payout(row)
                return PayoutResponse(
                    payout_id=payout.id,
                    beneficiary_id=payout.beneficiary_id,
                    status=payout.status,
                )

        provider = get_payout_provider(request.currency)
        result = provider.create_payout(request.amount, request.currency, request.beneficiary_meta)

        beneficiary_id = str(uuid.uuid4())
        payout_id = str(uuid.uuid4())
        now = _now().isoformat()

        conn.execute(
            """
            INSERT INTO beneficiaries (id, currency, meta, idempotency_key, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                beneficiary_id,
                request.currency.upper(),
                json.dumps(request.beneficiary_meta),
                idempotency_key,
                now,
                now,
            ),
        )

        conn.execute(
            """
            INSERT INTO payouts (
                id, amount, currency, status, beneficiary_id, idempotency_key, external_reference,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payout_id,
                _serialize_amount(request.amount),
                request.currency.upper(),
                PayoutStatus.processing.value,
                beneficiary_id,
                idempotency_key,
                result.external_reference,
                now,
                now,
            ),
        )

        return PayoutResponse(
            payout_id=payout_id,
            beneficiary_id=beneficiary_id,
            status=PayoutStatus.processing,
        )


def mark_payment_succeeded(
    payment_external_reference: str, payment_id: str, amount: Decimal, currency: str
) -> Optional[PaymentSettledEvent]:
    with db_transaction() as conn:
        if payment_id:
            row = conn.execute("SELECT * FROM payments WHERE id = ?", (payment_id,)).fetchone()
        else:
            row = conn.execute(
                "SELECT * FROM payments WHERE external_reference = ?",
                (payment_external_reference,),
            ).fetchone()
        if not row:
            return None

        conn.execute(
            "UPDATE payments SET status = ?, updated_at = ? WHERE id = ?",
            (PaymentStatus.succeeded.value, _now().isoformat(), row["id"]),
        )

        event = PaymentSettledEvent(
            payment_id=row["id"],
            amount=amount,
            currency=currency.upper(),
            occurred_at=_now(),
        )
        publish_payment_settled(event)
        conn.execute(
            "UPDATE payments SET status = ?, updated_at = ? WHERE id = ?",
            (PaymentStatus.settled.value, _now().isoformat(), row["id"]),
        )
        return event


def settle_payment_by_id(payment_id: str, amount: Decimal, currency: str) -> Optional[PaymentSettledEvent]:
    with db_transaction() as conn:
        row = conn.execute("SELECT * FROM payments WHERE id = ?", (payment_id,)).fetchone()
        if not row:
            return None
        conn.execute(
            "UPDATE payments SET status = ?, updated_at = ? WHERE id = ?",
            (PaymentStatus.settled.value, _now().isoformat(), payment_id),
        )
        event = PaymentSettledEvent(
            payment_id=payment_id,
            amount=amount,
            currency=currency.upper(),
            occurred_at=_now(),
        )
        publish_payment_settled(event)
        return event


def mark_payout_paid(external_reference: str) -> Optional[Payout]:
    with db_transaction() as conn:
        row = conn.execute(
            "SELECT * FROM payouts WHERE external_reference = ?", (external_reference,)
        ).fetchone()
        if not row:
            return None
        updated_at = _now()
        conn.execute(
            "UPDATE payouts SET status = ?, updated_at = ? WHERE id = ?",
            (PayoutStatus.paid.value, updated_at.isoformat(), row["id"]),
        )
        payout = _row_to_payout(row)
        payout.status = PayoutStatus.paid
        payout.updated_at = updated_at
        return payout


__all__ = [
    "create_collect",
    "create_payout",
    "mark_payment_succeeded",
    "settle_payment_by_id",
    "mark_payout_paid",
]
