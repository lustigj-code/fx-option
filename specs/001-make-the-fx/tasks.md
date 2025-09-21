# Tasks: Make the FX Portal Product Ready and Functioning

**Input**: `/specs/001-make-the-fx/plan.md`
**Prerequisites**: research.md, data-model.md, contracts/, quickstart.md

## Phase 1 – Setup & Tooling
- [T001] Update portal `.env.local.example` with required auth + API variables and document new keys in `specs/001-make-the-fx/quickstart.md`.
- [T002] Configure Next.js route handlers for API proxying in `apps/portal-web/app/api/*` scaffolding alongside lint rules.
- [T003] [P] Add UI kit theming tokens/components baseline in `packages/ui-kit/src/components/portal` with Storybook registration.

## Phase 2 – Tests First (Frontend & Backend)
- [T010] [P] Write Storybook stories + React Testing Library tests for updated exposure/quote/hedge components under `apps/portal-web/components/ui`.
- [T011] [P] Author Jest/RTL tests for admin dashboard cards/tables in `apps/admin/components` ensuring loading/error states.
- [T012] Create zod schemas mirroring gateway contracts in `specs/001-make-the-fx/contracts/gateway.ts` and add TypeScript contract tests in `apps/portal-web/lib/api/__tests__/gateway-contracts.test.ts`.
- [T013] Add pytest contract tests for gateway endpoints in `services/gateway/tests/test_contracts.py` validating schemas against FastAPI responses.

## Phase 3 – Core Implementation
- [T020] Replace portal mock data with live API integration across `apps/portal-web/app/exposures/page.tsx`, `app/quotes/page.tsx`, `app/hedges/page.tsx`, introducing React Query hooks in `apps/portal-web/lib/api`.
- [T021] Implement admin escalations/audit views using real data in `apps/admin/app/(dashboard)/page.tsx` and supporting routes (`/audit`, `/orders`, `/quotes`).
- [T022] Expand UI kit primitives (tables, cards, alert banners, modal) in `packages/ui-kit/src/components`, wired to new stories and tests.
- [T023] Harden gateway endpoints for latency + error responses (`services/gateway/app.py`, `schemas.py`) and ensure pricing/risk services return required fields.
- [T024] Update compliance documentation in `docs/compliance/Supervisory_Procedures.md` to reflect portal operational monitoring and audit trail updates.

## Phase 4 – Integration & Observability
- [T030] Implement shared API client with retry/backoff + audit hook in `apps/portal-web/lib/api/client.ts` and re-use in admin (`apps/admin/lib/api/client.ts`).
- [T031] Add telemetry instrumentation (OpenTelemetry + audit events) for quote requests, risk plan fetches, and execution triggers across portal/admin and gateway.
- [T032] Adjust `scripts/run-dev.sh` and CI workflows to launch portal/admin with correct flags and run contract tests automatically.

## Phase 5 – Polish & Sign-off
- [T040] Perform accessibility + responsive QA, logging results in `specs/001-make-the-fx/quickstart.md`.
- [T041] Execute manual runbook verifying audit chain entries and admin escalation flows, recording evidence in quickstart.
- [T042] [P] Run final verification commands (`pnpm lint`, `pnpm test`, `pytest`, `uvx --from git+https://github.com/github/spec-kit.git specify check`).
- [T043] Draft release notes summarising portal go-live scope in `docs/CHANGELOG.md` and prepare communication for stakeholders.

## Dependency Notes
- T001 → T002/T003 (environment + tooling before component work).
- T010/T011/T012/T013 must complete (tests red) before T020/T021/T023.
- UI kit expansion (T003, T022) precedes consuming components in portal/admin.
- Backend hardening (T023) required before telemetry instrumentation (T031).

## Parallel Execution Example
```
# After setup, run in parallel:
- T010 Storybook/tests for portal components.
- T011 Admin component tests.
- T012 TypeScript gateway contract tests.
- T013 pytest gateway contract tests.
```

## Validation Checklist
- [ ] Every task references a concrete file or command.
- [ ] Compliance/documentation updates included (T024, T041, T043).
- [ ] Tests precede implementation (Phase 2 before Phase 3).
- [ ] Observability tasks captured (T031).
- [ ] No `[NEEDS CLARIFICATION]` remain.
