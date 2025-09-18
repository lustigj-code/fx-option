import json
import os
import sys
from pathlib import Path

import pytest

ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

os.environ.setdefault("PAYMENTS_DATABASE_PATH", "test_payments.db")

from services.payments.app import PaymentsAPI
from services.payments.config import get_settings
from services.payments.database import initialize_schema, db_transaction
from services.payments.queue import event_queue
from services.payments.utils import compute_signature


@pytest.fixture(autouse=True)
def clean_database():
    db_path = Path(get_settings().database_path)
    if db_path.exists():
        db_path.unlink()
    initialize_schema()
    list(event_queue.drain())
    yield
    if db_path.exists():
        db_path.unlink()


@pytest.fixture
def api():
    return PaymentsAPI()


def _stripe_signature(body: dict) -> str:
    payload = json.dumps(body).encode("utf-8")
    return compute_signature(get_settings().stripe_webhook_secret, payload)


def _wise_signature(body: dict) -> str:
    payload = json.dumps(body).encode("utf-8")
    return compute_signature(get_settings().wise_webhook_secret, payload)


def test_collect_create_and_idempotency(api):
    payload = {"amount": "100.00", "currency": "USD", "customer_meta": {"customer_id": "c1"}}
    headers = {"Idempotency-Key": "collect-123"}

    status, body = api.post_collect_create(payload, headers=headers)
    assert status == 200
    assert body["provider"] == "stripe_ach"
    assert body["checkout_link"]

    status2, body2 = api.post_collect_create(payload, headers=headers)
    assert status2 == 200
    assert body2["payment_id"] == body["payment_id"]


def test_stripe_webhook_emits_event(api):
    payload = {"amount": "50.00", "currency": "USD", "customer_meta": {}}
    status, body = api.post_collect_create(payload)
    payment_id = body["payment_id"]

    with db_transaction() as conn:
        row = conn.execute("SELECT * FROM payments WHERE id = ?", (payment_id,)).fetchone()
        external_ref = row["external_reference"]

    webhook_body = {
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": external_ref,
                "amount": 5000,
                "currency": "usd",
                "metadata": {"payment_id": payment_id},
            }
        },
    }
    signature = _stripe_signature(webhook_body)

    status, response = api.post_webhook(
        "stripe",
        body=json.dumps(webhook_body).encode("utf-8"),
        headers={"Stripe-Signature": signature},
    )
    assert status == 200
    assert response["payment_id"] == payment_id

    _, events_body = api.get_events()
    events = events_body["events"]
    assert events
    assert events[0]["payload"]["payment_id"] == payment_id


def test_payout_and_wise_webhook(api):
    payload = {"amount": "25.00", "currency": "USD", "beneficiary_meta": {"account": "123"}}
    headers = {"Idempotency-Key": "payout-1"}

    status, body = api.post_payout_create(payload, headers=headers)
    assert status == 200
    payout_id = body["payout_id"]

    with db_transaction() as conn:
        row = conn.execute("SELECT * FROM payouts WHERE id = ?", (payout_id,)).fetchone()
        external_ref = row["external_reference"]

    webhook_body = {
        "event_type": "transfers#state-change",
        "current_state": "outgoing_payment_sent",
        "resource": {"id": external_ref},
    }
    signature = _wise_signature(webhook_body)

    status, response = api.post_webhook(
        "wise",
        body=json.dumps(webhook_body).encode("utf-8"),
        headers={"Wise-Signature": signature},
    )
    assert status == 200
    assert response["payout_id"] == payout_id

    with db_transaction() as conn:
        row = conn.execute("SELECT status FROM payouts WHERE id = ?", (payout_id,)).fetchone()
        assert row["status"] == "paid"
