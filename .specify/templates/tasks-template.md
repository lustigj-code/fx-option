# Tasks: [FEATURE NAME]

**Input**: `/specs/[###-feature-name]/plan.md`
**Prerequisites**: research.md, data-model.md, contracts/, quickstart.md

## Execution Flow
```
1. Parse plan.md to list impacted surfaces.
2. Load supporting docs (data-model.md, contracts/, research.md).
3. Generate tasks grouped by phase: Setup → Tests → Implementation → Integration → Polish.
4. Include exact file paths and tool commands (pnpm, pytest, uvx).
5. Mark tasks `[P]` only when files are independent.
6. Emit dependency graph and validation checklist.
```

## Format
`[T###] [P?] Description`

## Phase 1 – Setup & Tooling
- T001 Configure environment variables or feature flags for this feature.
- T002 Bootstrap Storybook/Next config updates in `apps/portal-web` or `apps/admin`.
- T003 [P] Update shared UI kit scaffolding in `packages/ui-kit/src`.

## Phase 2 – Tests First (Frontend & Backend)
- T010 [P] Component story/tests in `apps/portal-web/components/...`.
- T011 [P] Component story/tests in `apps/admin/components/...`.
- T012 Contract tests for gateway/client integration (TypeScript or pytest).
- T013 Pytest coverage for affected services in `services/.../tests`.

## Phase 3 – Core Implementation
- T020 Implement portal feature work under `apps/portal-web/app/...`.
- T021 Implement admin workflows under `apps/admin/app/...`.
- T022 Update shared UI kit primitives.
- T023 Backend service or gateway adjustments.
- T024 Docs updates under `docs/...` when compliance or connectors change.

## Phase 4 – Integration & Observability
- T030 Wire API clients, data fetching hooks, and error states.
- T031 Ensure telemetry/audit logging as per quickstart.
- T032 Update scripts (`scripts/run-dev.sh`, CI workflows) if required.

## Phase 5 – Polish & Sign-off
- T040 Accessibility and responsive QA per quickstart.
- T041 Manual test steps executed (document results in quickstart).
- T042 [P] Run `pnpm lint`, `pnpm test`, `pytest`, `uvx ... specify check`.
- T043 Prepare changelog or release notes if needed.

## Dependency Rules
- Tests (Phase 2) must fail before implementation tasks start.
- Shared UI kit updates precede portal/admin usage.
- Backend client changes must land before telemetry/audit tasks.

## Parallel Execution Example
```
T010, T011, T012 can proceed in parallel (different directories).
Hold T020 until T010/T012 are failing green.
```

## Validation Checklist
- [ ] Every task references a concrete file or command.
- [ ] Compliance/documentation tasks included when spec touches regulated flows.
- [ ] Tests precede implementation in ordering.
- [ ] Observability tasks present for gateway integrations.
- [ ] No `[NEEDS CLARIFICATION]` remain in task descriptions.
