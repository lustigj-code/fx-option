# Quickstart – Make the FX Portal Product Ready and Functioning

## Prerequisites
- Node 18+, pnpm installed.
- Python 3.11 with virtualenv for gateway/services.
- FastAPI gateway running locally: `uvicorn services.gateway.app:app --reload` (dry-run mode default).
- `.env.local` files populated for portal/admin (NextAuth secrets, API base URL).

## Environment Variables
Populate `apps/portal-web/.env.local` using the example file. Required keys:

- `NEXTAUTH_SECRET` – random string used to encrypt NextAuth JWT/session data.
- `NEXTAUTH_URL` – public URL of the portal instance (defaults to `http://localhost:3000`).
- `PORTAL_DEMO_USERNAME` / `PORTAL_DEMO_PASSWORD` – seeded credential pair for the credentials provider.
- `PORTAL_AUTH_DEMO_MODE` – set to `true` to enable demo sign-in bypass for local testing.
- `NEXT_PUBLIC_API_BASE_URL` – FastAPI gateway base URL consumed by route handlers and React Query.
- `PORTAL_GATEWAY_API_KEY` – bearer token forwarded from Next.js route handlers to the gateway.
- `PORTAL_AUDIT_BASE_URL` – audit service base URL used for compliance logging hooks.
- `PORTAL_AUDIT_API_KEY` – secret used to authenticate audit log submissions.
- `NEXT_PUBLIC_OTEL_COLLECTOR_URL` – OTLP/HTTP collector endpoint for OpenTelemetry browser exports.
- `NEXT_PUBLIC_OTEL_SERVICE_NAME` – logical service name used in telemetry payloads.

## Setup
1. Install JS deps: `pnpm install`.
2. Install Python deps: `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`.
3. Start gateway: `uvicorn services.gateway.app:app --reload`.
4. Launch portal: `pnpm --filter portal-web dev --hostname 0.0.0.0`.
5. Launch admin: `pnpm --filter admin dev --hostname 0.0.0.0`.

## Verification Steps
1. **Authentication**: Hit portal login, confirm NextAuth session created, audit event logged.
2. **Exposures Dashboard**: Navigate to `/exposures`, verify live data from gateway with skeletons during load and error banner if gateway stopped.
3. **Quotes Comparison**: Request binding quotes; ensure best quote flagged and audit record captured in admin events.
4. **Hedge Playbooks**: Trigger dry-run execution; confirm success toast and admin receives oversight entry.
5. **Admin Oversight**: Visit `http://localhost:3001` (admin) to review escalations, audit events, and acknowledge tasks.
6. **Compliance Log**: Run `python -m services.audit.cli data/audit.db` to confirm new events appended.

## Automated Checks
- `pnpm --filter ui-kit build && pnpm --filter ui-kit test`
- `pnpm --filter portal-web lint && pnpm --filter portal-web test`
- `pnpm --filter admin lint && pnpm --filter admin test`
- `pytest services`
- `uvx --from git+https://github.com/github/spec-kit.git specify check`

## Telemetry Validation
- Ensure OpenTelemetry exporter logs appear for quote and execution flows.
- Verify policy breach alerts emit to admin events.
- Confirm metrics endpoint (if enabled) reports quote latency <5s.
