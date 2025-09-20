# fx-option

## Gateway

The gateway service in `services/gateway/app.py` exposes a minimal in-process application
with a `/api/execution/orders` endpoint. Requests are validated against the hedge
schemas before being passed to a dry-run execution service. The execution service
simulates laddered orders and persists request/response payloads under `data/execution/`.

### POST `/api/execution/orders`

Submit a hedge request to create laddered orders without contacting the live IBKR
broker. The payload mirrors the execution sync models:

```json
{
  "strategy_id": "alpha",
  "instrument": "EURUSD",
  "side": "BUY",
  "notional": 1000000,
  "base_price": 1.1,
  "levels": 3,
  "price_increment": 0.0005
}
```

A successful response includes the generated laddered orders, each with a unique
identifier and a simulated broker reference:

```json
{
  "request_id": "9e57bb0a-4f2f-4e0b-8467-55d3228a4686",
  "status": "submitted",
  "orders": [
    {
      "leg_id": "alpha-1",
      "quantity": 303030.30303,
      "limit_price": 1.1,
      "status": "submitted",
      "broker_reference": "DRY-6f9ac211"
    }
  ]
}
```

Validation errors return a `422` status with details about the offending fields.
