# Quickstart – Auth & RBAC rollout

## Prerequisites
- `.env.local` for portal/admin includes NextAuth secrets, provider credentials, MFA flag.
- Seed demo users with roles in `scripts/seed-auth-users.ts` (to be created).
- FastAPI gateway running with token validation middleware disabled until integration complete.

## Setup Steps
1. `pnpm install`
2. Copy `.env.local.example` to `.env.local` for portal/admin, fill secrets.
3. Start identity mock service (if used) or rely on NextAuth credentials provider.
4. `pnpm --filter portal-web dev --hostname 0.0.0.0`
5. `pnpm --filter admin dev --hostname 0.0.0.0`

## Verification Workflow
1. Login as treasury manager → access portal routes, confirm admin redirect.
2. Login as compliance officer → forced MFA enrollment, confirm admin access after verification.
3. Attempt unauthorized route → observe access denied page and audit entry.
4. Expire session manually → confirm auto logout and audit log.
5. Check `services/audit` output to ensure auth events recorded.

## Automated Checks
- `pnpm --filter portal-web test -- auth`
- `pnpm --filter admin test -- auth`
- `pytest services/audit/tests`
- `uvx --from git+https://github.com/github/spec-kit.git specify check`

## Telemetry & Audit Validation
- Confirm OpenTelemetry spans for auth events appear in logs.
- Run `python -m services.audit.cli data/audit.db` to verify entries.
