# fx-option

## Payments Service

The `services/payments` package exposes a lightweight payments orchestration
layer that handles collect (Stripe ACH or dLocal) and payout (Wise) workflows
with webhook verification, idempotency, and sandbox-friendly integrations.

### Running locally

The service is framework-free and can be exercised through the
`PaymentsAPI` facade:

```python
from services.payments.app import app

status, body = app.post_collect_create({
    "amount": "10.00",
    "currency": "USD",
    "customer_meta": {"customer_id": "abc"},
})
```

### Testing

```
pytest services/payments/tests
```
