# fx-option

Unified monorepo for the FX option platform. It includes:

- `packages/ui-kit` – Emerald design system published as a reusable React kit.
- `apps/portal-web` – Client portal shell built with Next.js using the Emerald components.
- `apps/admin` – Operator control room with live monitoring and admin workflows.
- `services/` – Python services covering pricing orchestration, market data, risk netting, payments, audit chains, connectors, and execution workflows.
- `docs/` – Product, compliance, and connector documentation.

## Frontend development

```bash
pnpm install
pnpm --filter ui-kit storybook
pnpm --filter portal-web dev
pnpm --filter admin dev
```

## Python services

Install shared dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the full pytest suite:

```bash
pytest
```

### Gateway settings

Environment variables accepted by the gateway service:

| Variable | Purpose | Default |
| --- | --- | --- |
| `GATEWAY_STORAGE_DIR` | Directory for persisted execution payloads | `./data/execution-orders` |
| `GATEWAY_DRY_RUN` | Set to `false` to connect to IBKR | `true` |
| `GATEWAY_HOST` | Host interface for the CLI runner | `0.0.0.0` |
| `GATEWAY_PORT` | Port used by the CLI runner | `8000` |

Run the gateway via the CLI entry point:

```bash
python -m services.gateway
```

### Audit verification CLI

Generate a tamper-evident audit chain or validate an existing SQLite log:

```bash
python -m services.audit.cli path/to/audit.db
```

### Execution tooling

The CME MXN option execution service lives under `services/execution`. It uses `ib-insync` to place laddered hedges asynchronously and persist fills. A synchronous, storage-first variant is available under `services/execution_sync` together with its own test harness while the team evaluates the two approaches.

### Payments orchestration

`services/payments` exposes a lightweight payments layer that orchestrates collect (Stripe ACH or dLocal) and payout (Wise) workflows. Use the app facade directly when running locally:

```python
from services.payments.app import app

status, body = app.post_collect_create({
    "amount": "10.00",
    "currency": "USD",
    "customer_meta": {"customer_id": "abc"},
})
```

Run the targeted suite with:

```bash
pytest services/payments/tests
```

### Gateway API

`services/gateway` provides a FastAPI wrapper that stitches the pricing orchestrator, risk service, and (placeholder) execution logic into a single HTTP surface. Run it locally with uvicorn:

```
uvicorn services.gateway.app:app --reload
```

Available endpoints:

- `POST /api/quotes/binding` &mdash; generate a binding quote for an exposure using supplied market data.
- `POST /api/risk/plan` &mdash; return weekly netting buckets and execution recommendations.
- `POST /api/execution/orders` &mdash; submit laddered hedges (dry-run by default).

## Connectors

- Siigo webhook subscription helper (`services/connectors/siigo`).
- QuickBooks Online connector and webhook handler (`services/connectors/qbo`).

Refer to the docs in `docs/connectors/` for onboarding notes.

## Running the full stack

Use the helper script to start the gateway, portal, and admin apps locally:

```bash
./scripts/run-dev.sh
```

Environment variables used by the front-end apps:

- `NEXT_PUBLIC_API_BASE_URL` – base URL for the portal gateway (default `http://localhost:8000`).
- `ADMIN_API_BASE_URL` – base URL for the admin dashboards (default `http://localhost:8000`).
