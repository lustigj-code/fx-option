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

Install shared dependencies with extras for testing:

```bash
pip install -e .[dev]
```

Run the full pytest suite:

```bash
pytest
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

The current build focuses on wiring the pricing and risk flows; execution placement is stubbed for now.

## Connectors

- Siigo webhook subscription helper (`services/connectors/siigo`).
- QuickBooks Online connector and webhook handler (`services/connectors/qbo`).

Refer to the docs in `docs/connectors/` for onboarding notes.
