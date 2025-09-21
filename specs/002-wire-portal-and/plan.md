# Implementation Plan: Wire portal/admin to FastAPI gateway

**Branch**: `[002-wire-portal-and]` | **Date**: 2025-08-13 | **Spec**: specs/002-wire-portal-and/spec.md
**Input**: Feature specification from `/specs/002-wire-portal-and/spec.md`

## Execution Flow
```
1. Load spec.md.
2. Confirm constitution compliance (shared UI kit, tests first, observability).
3. Produce research/data-model/quickstart (complete).
4. Prepare contracts/ directory (zod schemas) before tasks.
5. Stop before tasks.
```

## Summary
We will build a shared TypeScript client layer for the FastAPI gateway, define polling/backoff policies, and wire telemetry/audit hooks so portal/admin rely on consistent data access. Frontend work will reuse UI kit components for loading/error states, while backend updates refine schemas and logging to match client expectations.

## Technical Context
- Next.js 13.5 (portal) and 14.2 (admin)
- Shared workspace alias for `apps/shared/api`
- Zod schemas mirroring `services/gateway/schemas.py`
- OpenTelemetry JS + audit service for instrumentation
- Compliance references in `docs/compliance`

## Constitution Check
- Spec-driven (yes)
- Compliance-centric (telemetry + audit mapping)
- One UI language (UI kit loading/error components)
- Test-first (Storybook/tests + contract tests)
- Resilient integrations (retry/backoff, telemetry)

## Project Structure
```
apps/shared/api/
  client.ts
  endpoints.ts
apps/portal-web/
  lib/api/
apps/admin/
  lib/api/
packages/ui-kit/
  src/components/status/
services/gateway/
  app.py
  schemas.py
specs/002-wire-portal-and/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/
```

## Research
- Resolve open questions around SLA limits, auth refresh, telemetry dashboards.

## Design & Contracts
- Create `contracts/gateway.ts` with zod schemas for endpoints.
- Document polling configuration (env variables) and exposures/quotes mapping.

## Phase 2 (for /tasks)
- Tests: contract tests TypeScript + pytest, component tests for loading/error states.
- Implementation: shared client module, portal/admin integration, gateway logging updates.
- Observability: telemetry instrumentation, audit logging.

## Checklist
- [x] Research doc created
- [x] Data model drafted
- [x] Quickstart ready
- [ ] Contracts pending (to be created before tasks)

## Progress Tracking
- [x] Research
- [x] Data model
- [x] Quickstart
- [ ] Contracts (TODO)
