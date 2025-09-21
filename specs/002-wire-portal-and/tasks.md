# Tasks: Wire portal/admin to FastAPI gateway

**Input**: `/specs/002-wire-portal-and/plan.md`
**Prerequisites**: research.md, data-model.md, contracts/, quickstart.md

## Phase 1 – Setup & Tooling
- [T001] Establish shared workspace alias (`@shared/api`) and placeholder client in `apps/shared/api/client.ts`, documenting env variables for polling/backoff.
- [T002] Add configuration entries to portal/admin `.env.local.example` for polling cadence and backoff limits, update quickstart.

## Phase 2 – Tests First
- [T010] [P] Draft zod schemas in `specs/002-wire-portal-and/contracts/gateway.ts` and TypeScript contract tests in `apps/shared/api/__tests__/gateway-contracts.test.ts` validating schema parsing.
- [T011] [P] Write React Testing Library tests for portal loading/error components consuming the shared client (`apps/portal-web/components/ui/*`).
- [T012] Add Jest tests for admin error states using shared UI kit components (`apps/admin/components/status/*`).
- [T013] Extend pytest contract tests in `services/gateway/tests/test_contracts.py` to ensure responses match schema expectations.

## Phase 3 – Core Implementation
- [T020] Implement shared client (fetch wrapper, retries, telemetry hook) in `apps/shared/api/client.ts` and export typed endpoint functions.
- [T021] Refactor portal API layer to use shared client (`apps/portal-web/lib/api/*.ts`) and replace local fetch logic.
- [T022] Refactor admin API layer similarly (`apps/admin/lib/api/*.ts`), ensuring consistent error handling.
- [T023] Add UI kit loading/error primitives in `packages/ui-kit/src/components/status/*` and integrate into portal/admin pages.
- [T024] Update gateway logging to emit structured latency/error metrics (`services/gateway/app.py` + telemetry integration) synced with client events.

## Phase 4 – Integration & Observability
- [T030] Wire telemetry pipeline: emit OpenTelemetry spans in client, forward server logs to audit (`services/audit`, `services/gateway`).
- [T031] Implement feature flag & configuration for polling/backoff (`apps/shared/api/config.ts` + env usage in both apps).
- [T032] Update docs (`docs/compliance/Supervisory_Procedures.md` and new developer runbook entry) to describe monitoring/escalation flow.

## Phase 5 – Polish & Sign-off
- [T040] Validate manual run (portal + admin) capturing success/failure scenarios; record evidences in `quickstart.md`.
- [T041] Execute automated checks (pnpm tests, pytest, uvx specify check, telemetry sample) and log output.
- [T042] Prepare changelog entry and communication plan for enabling live gateway integration.

## Dependency Notes
- T001 → T010 (schemas rely on shared alias).
- Contract tests (T010–T013) must pass before refactors (T020–T024).
- Telemetry tasks (T030–T031) depend on client implementation (T020–T022) and gateway logging (T024).

## Parallel Execution Example
```
# After setup:
- Run T010 (schemas/tests), T011, T012, T013 in parallel (different directories).
```

## Validation Checklist
- [ ] All tasks point to concrete files.
- [ ] Tests precede implementation changes.
- [ ] Telemetry & compliance documentation captured (T030–T032).
- [ ] Quickstart updated with manual/automated checks.
