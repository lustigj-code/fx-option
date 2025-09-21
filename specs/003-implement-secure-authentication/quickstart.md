# Quickstart – Auth & RBAC rollout

## Prerequisites
- `.env.local` for portal/admin includes:
  - `NEXTAUTH_SECRET` / `NEXTAUTH_URL` specific to each app (portal → http://localhost:3000, admin → http://localhost:3001).
  - Credentials bootstrap (`PORTAL_DEMO_USERNAME`, `PORTAL_DEMO_PASSWORD`, `ADMIN_DEMO_USERNAME`, `ADMIN_DEMO_PASSWORD`).
  - Session lifetimes (`SESSION_MAX_AGE`, `PORTAL_SESSION_MAX_AGE`, `ADMIN_SESSION_MAX_AGE`).
  - MFA toggles (`PORTAL_AUTH_MFA_ENABLED`, `PORTAL_AUTH_MFA_REQUIRED_ROLES`, `ADMIN_AUTH_MFA_ENABLED`, `ADMIN_AUTH_MFA_REQUIRED_ROLES`).
  - Role seed reference pointing to `specs/003-implement-secure-authentication/contracts/seed/roles.json`.
  - Audit hooks (`AUDIT_WEBHOOK_URL` or app-specific `PORTAL_AUDIT_WEBHOOK_URL` / `ADMIN_AUDIT_WEBHOOK_URL`) pointing to the audit service ingest endpoint.
  - Admin dashboards expect `AUDIT_SERVICE_URL` (or `ADMIN_AUDIT_SERVICE_URL`) for read access to `/events/auth`.
  - Lockout policies via `AUTH_FAILED_ATTEMPT_THRESHOLD`, `AUTH_FAILED_ATTEMPT_WINDOW_SECONDS`, `AUTH_LOCKOUT_DURATION_SECONDS` (overridable per app using `PORTAL_*/ADMIN_*` prefixes).
- Seed demo users with roles in `scripts/seed-auth-users.ts` (to be created).
- FastAPI gateway running with token validation middleware disabled until integration complete.
 - Start the audit FastAPI service: `uvicorn services.audit.app:app --reload --host 0.0.0.0 --port 8002` (adjust DB path via `AUDIT_DB_PATH`).

## Setup Steps
1. `pnpm install`
2. Copy `.env.local.example` to `.env.local` for portal/admin, fill secrets and confirm MFA + seed variables align with the desired demo roles.
3. Start identity mock service (if used) or rely on NextAuth credentials provider.
4. `pnpm --filter portal-web dev --hostname 0.0.0.0`
5. `pnpm --filter admin dev --hostname 0.0.0.0`

## Verification Workflow
1. Login as treasury manager → access portal routes, confirm admin redirect.
2. Login as compliance officer → forced MFA enrollment, confirm admin access after verification.
3. Attempt unauthorized route → observe access denied page and audit entry.
4. Expire session manually → confirm auto logout and audit log.
5. Check `services/audit` output (API `/events/auth` or CLI) to ensure auth events recorded.

## QA Evidence
- 2025-08-13: Portal treasury_manager login successful; verified quotes dashboard and confirmed admin middleware redirects to `/auth/access-denied`.
- 2025-08-13: Compliance officer login prompted MFA enrollment, verified `/auth/mfa` challenge and subsequent admin access to `/audit` after verification.
- 2025-08-13: Simulated lockout with repeated failures; audit service recorded `ACCOUNT_LOCKED` event and admin dashboard reflected entry.
- 2025-08-13: Session expiry triggered logout and audit record; Control Room audit view refreshed with logout event.

## Automated Checks
- ✅ `pnpm --filter portal-web test`
- ✅ `pnpm --filter admin test`
- ✅ `pnpm --filter ui-kit test`
- ✅ `pytest services/audit/tests`
- ✅ `pytest services/gateway/tests`
- ❌ `uvx --from git+https://github.com/github/spec-kit.git specify check` *(fails: Git operation failed in offline environment)*

## Telemetry & Audit Validation
- Confirm OpenTelemetry spans for auth events appear in logs.
- Run `python -m services.audit.cli data/audit.db` to verify entries.
