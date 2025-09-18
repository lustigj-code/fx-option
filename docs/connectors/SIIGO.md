# Siigo Connector

This connector exposes Siigo webhook subscriptions so that external systems can
consume invoice, inventory or customer updates in near real-time. The
implementation is intentionally lightweight and only depends on Python's
standard library so it can run in constrained environments.

## Features

- OAuth style authentication with token caching
- Simple helper to create webhook subscriptions
- CLI tooling to provision sandbox or production subscriptions
- Local sandbox harness for tests and demonstrations

## Project layout

```text
services/
  connectors/
    siigo/
      config.py            # environment helpers
      exceptions.py        # connector-specific exception hierarchy
      http.py              # minimal HTTP client that uses urllib
      subscription.py      # high level subscription helper
      subscription_tool.py # CLI entry-point (python -m services.connectors.siigo.subscription_tool)
```

## Usage

### 1. Install dependencies

The connector only uses the Python standard library. If you are running it in a
clean environment ensure Python 3.10+ is available.

### 2. Create a sandbox subscription

The snippet below demonstrates a complete sandbox flow. It uses the CLI tool to
authenticate, obtain an access token and provision a webhook subscription. You
need valid sandbox credentials from Siigo.

```bash
python -m services.connectors.siigo.subscription_tool \
  https://example.com/webhooks/siigo \
  invoices.send,invoices.update \
  sandbox.user@example.com \
  sandbox-access-key \
  sandbox-client-id \
  sandbox-client-secret
```

Optional flags:

- `--description` – Annotate the subscription.
- `--header KEY=VALUE` – Add custom headers (repeat for multiple headers).
- `--sandbox-url` – Point the tool to a custom base URL (used by the automated
  sandbox tests).

### 3. Programmatic usage

```python
from services.connectors.siigo.subscription import (
    SiigoCredentials,
    SiigoWebhookSubscription,
)

credentials = SiigoCredentials(
    username="sandbox.user@example.com",
    access_key="sandbox-access-key",
    client_id="sandbox-client-id",
    client_secret="sandbox-client-secret",
)

client = SiigoWebhookSubscription(credentials, environment="sandbox")
subscription = client.create_subscription(
    "https://example.com/webhooks/siigo",
    ["invoices.send", "invoices.update"],
    headers={"x-custom-secret": "shared-secret"},
    description="FX-Option Siigo sandbox",
)
print(subscription["id"])
```

### Local sandbox demonstration

The automated tests spin up a miniature HTTP server that mimics the relevant
Siigo endpoints. You can run the same flow locally:

```bash
python -m unittest tests.test_siigo_sandbox_flow
```

The test harness verifies that:

1. A token is requested with the expected payload.
2. The connector automatically injects the bearer token when creating the
   subscription.
3. The server receives the subscription payload with headers and event
   definitions.

## Webhook delivery

When Siigo triggers the webhook it will POST JSON payloads to the target URL.
Use the custom headers feature to include verification secrets and validate
incoming requests server-side.

## Production considerations

- Store tokens securely and refresh them before the TTL expires. The helper
  caches tokens for 25 minutes.
- Wrap API invocations in retries to handle transient errors.
- Log both the request identifiers and the responses to help Siigo support
  trace deliveries.
- Verify HTTPS certificates if you override the base URL.
