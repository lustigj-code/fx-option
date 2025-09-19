# fx-option

Unified monorepo for the FX option platform. It includes:

- `packages/ui-kit` – Emerald design system published as a reusable React kit.
- `apps/portal-web` – Client portal shell built with Next.js using the Emerald components.
- `apps/admin` – Operator control room with live monitoring and admin workflows.
- `services/` – Python services covering pricing orchestration, market data, risk netting, audit chains, connectors, and execution workflows.
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

## Connectors

- Siigo webhook subscription helper (`services/connectors/siigo`).
- QuickBooks Online connector and webhook handler (`services/connectors/qbo`).

Refer to the docs in `docs/connectors/` for onboarding notes.
