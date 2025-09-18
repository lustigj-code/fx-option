# QuickBooks Online Connector

This service listens for QuickBooks Online (QBO) invoice webhooks and publishes
`ExposureCreated` events whenever a foreign-currency invoice with a due date is
observed.

## Overview

* **Location:** `services/connectors/qbo`
* **Runtime:** Python 3.11, FastAPI
* **Primary entrypoint:** `services/connectors/qbo/app.py`

## Environment variables

| Variable | Description |
| --- | --- |
| `QBO_CLIENT_ID` | OAuth2 client id from the Intuit developer portal. |
| `QBO_CLIENT_SECRET` | OAuth2 client secret. |
| `QBO_REDIRECT_URI` | Redirect URI registered with Intuit. |
| `QBO_REALM_ID` | Company realm identifier. |
| `QBO_WEBHOOK_VERIFIER_TOKEN` | Token used to validate webhook signatures. |
| `QBO_ENVIRONMENT` | `sandbox` (default) or `production`. |
| `QBO_EXPOSURE_TOPIC` | Topic used when emitting `ExposureCreated` events. |
| `QBO_HTTP_TIMEOUT` | Optional HTTP timeout in seconds (default `2.5`). |

## OAuth2

The connector exposes a FastAPI application that can be paired with the
standard Intuit OAuth2 authorization code flow. The `QBOOAuthClient` exchanges
authorization codes and refreshes tokens using the Intuit token endpoint.
Tokens are persisted in-memory via `TokenStore`; replace this with a durable
backend (e.g. Redis) for production use.

## Webhook processing

The `/qbo/webhook` endpoint validates incoming Intuit webhook signatures using
the HMAC-SHA256 algorithm. Only `Invoice.Create` and `Invoice.Update` events are
processed. Each event is handled in a background task to ensure the webhook
response is returned in well under three seconds.

For each invoice:

1. Fetch the full invoice payload via the QBO API.
2. Retrieve the company's home currency from `CompanyInfo` (cached in-memory).
3. Skip invoices without a due date or without a currency code.
4. Ignore invoices denominated in the home currency.
5. Emit an `ExposureCreated` event for every foreign-currency invoice with a due
   date.

## Exposure payload

The emitted event is logged in JSON form by `ExposureEmitter`. Integrate this
class with the internal message bus to deliver the payload downstream. The
structure is:

```json
{
  "type": "ExposureCreated",
  "topic": "exposure.created",
  "invoice_id": "123",
  "amount": 102.56,
  "currency": "EUR",
  "due_date": "2024-02-20",
  "counterparty": "ACME GmbH",
  "metadata": {
    "doc_number": "INV-123",
    "status": "Open",
    "link": "123"
  }
}
```

## Running locally

Create a virtual environment and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn services.connectors.qbo.app:app --reload
```

Configure a public HTTPS endpoint (for example using ngrok) and register it in
the Intuit developer portal to receive invoice webhooks.
