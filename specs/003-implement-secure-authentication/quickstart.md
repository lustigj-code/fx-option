# Quickstart – Auth & RBAC rollout

## Prerequisites
- Copy the `.env.local.example` files for portal/admin and populate the variables listed below (NextAuth secrets, MFA toggles, seed data paths).
- Seed demo users with roles in `scripts/seed-auth-users.ts` (to be created).
- FastAPI gateway running with token validation middleware disabled until integration complete.

### Environment Variables Overview
| App | Key | Purpose |
| --- | --- | --- |
| Portal | `NEXTAUTH_SECRET` | Signing secret for local sessions. |
| Portal | `NEXTAUTH_URL` | Base URL for NextAuth callbacks (`http://localhost:3000`). |
| Portal | `PORTAL_DEMO_USERNAME` / `PORTAL_DEMO_PASSWORD` | Credentials for demo treasury manager account. |
| Portal | `PORTAL_DEMO_ROLES` | Comma-separated roles granted to the portal demo user. |
| Portal | `PORTAL_ROLE_SEED_PATH` | Relative path to seed JSON containing portal user roles. |
| Portal | `PORTAL_REQUIRE_MFA_ROLES` | Roles requiring MFA before privileged actions. |
| Portal | `PORTAL_MFA_OPTIONAL_ROLES` | Roles allowed to defer MFA during initial rollout. |
| Portal | `NEXT_PUBLIC_ENABLE_MFA_PROMPT` | Feature flag toggling MFA prompts in the UI. |
| Portal | `PORTAL_MFA_ENROLL_ENDPOINT` / `PORTAL_MFA_VERIFY_ENDPOINT` | API routes powering MFA enrollment/verification. |
| Portal | `PORTAL_SESSION_MAX_AGE_SECONDS` | Session lifetime used in NextAuth configuration. |
| Portal | `PORTAL_AUDIT_BASE_URL` | Base URL for forwarding auth audit events. |
| Portal | `PORTAL_SUPPORT_EMAIL` | Escalation contact for access requests (server-only). |
| Portal | `NEXT_PUBLIC_SUPPORT_EMAIL` | Client-visible support contact shown on login/access denied views. |
| Portal | `NEXT_PUBLIC_API_BASE_URL` | Gateway URL surfaced to the client. |
| Admin | `NEXTAUTH_SECRET` | Signing secret for admin NextAuth instance. |
| Admin | `NEXTAUTH_URL` | Base URL for admin callbacks (`http://localhost:3001`). |
| Admin | `ADMIN_DEMO_USERNAME` / `ADMIN_DEMO_PASSWORD` | Demo compliance/admin user credentials. |
| Admin | `ADMIN_DEMO_ROLES` | Roles assigned to the admin demo user. |
| Admin | `ADMIN_ROLE_SEED_PATH` | Relative path to seed JSON for admin-facing roles. |
| Admin | `ADMIN_REQUIRE_MFA` / `ADMIN_REQUIRE_MFA_ROLES` | Flags enforcing MFA for privileged admin roles. |
| Admin | `NEXT_PUBLIC_ENABLE_MFA_PROMPT` | Feature flag controlling MFA prompts for admin UI. |
| Admin | `ADMIN_MFA_ENROLL_ENDPOINT` / `ADMIN_MFA_VERIFY_ENDPOINT` | Admin MFA API routes. |
| Admin | `ADMIN_SESSION_MAX_AGE_SECONDS` | Admin session timeout (stricter than portal). |
| Admin | `ADMIN_AUDIT_BASE_URL` | Base URL for forwarding admin auth audit events. |
| Admin | `ADMIN_SUPPORT_EMAIL` | Server-side contact email for privileged access issues. |
| Admin | `NEXT_PUBLIC_ADMIN_SUPPORT_EMAIL` | Client-visible support contact surfaced in admin auth screens. |
| Admin | `ADMIN_API_BASE_URL` | Gateway base URL for privileged admin requests. |

## Setup Steps
1. `pnpm install`
2. Copy `.env.local.example` to `.env.local` for portal/admin, fill secrets and adjust URLs/endpoints as needed.
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
