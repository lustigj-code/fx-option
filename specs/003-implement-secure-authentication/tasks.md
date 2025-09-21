# Tasks: Secure Authentication & RBAC

**Input**: `/specs/003-implement-secure-authentication/plan.md`
**Prerequisites**: research.md, data-model.md, contracts/, quickstart.md

## Phase 1 – Setup & Tooling
- [T001] Create shared auth workspace module `apps/shared/auth/index.ts` with session helpers, role definitions, and update `tsconfig` paths.
- [T002] Update portal/admin `.env.local.example` with NextAuth secrets, MFA flags, and role seed data references; document in quickstart.

## Phase 2 – Tests First
- [T010] [P] Author Jest/RTL unit tests for login form, access denied state, and route guard hook in `apps/portal-web/components/auth/*`.
- [T011] [P] Add admin-side tests covering MFA prompts and restricted views in `apps/admin/components/auth/*`.
- [T012] Define zod schemas for JWT payloads and MFA endpoints in `specs/003-implement-secure-authentication/contracts/auth.ts`, with TypeScript tests in `apps/shared/auth/__tests__/contracts.test.ts`.
- [T013] Extend pytest coverage in `services/audit/tests/test_auth_events.py` validating emitted audit events.

## Phase 3 – Core Implementation
- [T020] Configure NextAuth in portal (`apps/portal-web/pages/api/auth/[...nextauth].ts`) with credential provider, session callbacks adding role claims, and audit hooks.
- [T021] Implement middleware and role-based route guards in portal (`apps/portal-web/middleware.ts`, `lib/auth/useAuthorization.ts`).
- [T022] Mirror NextAuth + guards in admin app, enforcing MFA requirement and privileged roles.
- [T023] Build UI kit auth components (login form, access denied banner, MFA modal) in `packages/ui-kit/src/components/auth/*` and replace ad-hoc UI.
- [T024] Implement MFA enrollment/verification endpoints (Next.js API routes or FastAPI stub) and link to UI flows.
- [T025] Add gateway middleware (e.g., `services/gateway/security/auth_middleware.py`) to validate JWT scopes and log unauthorized access.

## Phase 4 – Integration & Compliance
- [T030] Wire audit logging: append auth events to `services/audit` pipeline and expose review in admin dashboard.
- [T031] Configure session timeout, lockout policies, and document environment toggles (e.g., `SESSION_MAX_AGE`, `FAILED_ATTEMPT_THRESHOLD`).
- [T032] Update compliance docs (`docs/compliance/Supervisory_Procedures.md`) with new authentication controls, MFA process, and escalation path.

## Phase 5 – Polish & Sign-off
- [T040] Perform end-to-end manual QA for each role (login, route access, MFA) and capture evidence in quickstart.
- [T041] Run automated checks (pnpm tests, pytest, uvx specify check), attach logs to quickstart.
- [T042] Prepare release notes + change summary for compliance review (e.g., `docs/CHANGELOG.md`).

## Dependency Notes
- Shared auth module (T001) precedes tests/implementation.
- Tests (T010–T013) must precede implementations (T020+).
- Gateway middleware (T025) and audit logging (T030) depend on NextAuth configuration.

## Parallel Execution Example
```
After setup, run T010, T011, T012, T013 in parallel—they touch different directories.
```

## Validation Checklist
- [ ] Tasks reference concrete files.
- [ ] Tests first ordering maintained.
- [ ] Compliance documentation captured (T032).
- [ ] Quickstart updates recorded post-QA.
