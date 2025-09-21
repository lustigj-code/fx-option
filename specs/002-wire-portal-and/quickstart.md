# Quickstart – Gateway client integration

## Prerequisites
- Node 18+, pnpm
- FastAPI gateway running locally
- OpenTelemetry collector (optional) for local telemetry testing

## Setup
1. `pnpm install`
2. Copy `.env.local.example` to `.env.local` in both `apps/portal-web` and `apps/admin`, adjusting gateway polling/backoff values as needed:
   - `NEXT_PUBLIC_GATEWAY_BASE_URL`
   - `NEXT_PUBLIC_GATEWAY_ENABLED`
   - `NEXT_PUBLIC_GATEWAY_POLL_INTERVAL_MS`
   - `NEXT_PUBLIC_GATEWAY_MAX_BACKOFF_MS`
   - `NEXT_PUBLIC_GATEWAY_RETRY_LIMIT`
3. `pnpm --filter portal-web dev --hostname 0.0.0.0`
4. `pnpm --filter admin dev --hostname 0.0.0.0`
5. `uvicorn services.gateway.app:app --reload`

## Verification
- Portal exposures/quotes update every 10s, handle gateway outage gracefully.
- Admin dashboards reflect same data with error banners during outage.
- Telemetry logs show latency metrics and error events.
- Audit trail records user actions with endpoint metadata.
- Manual verification (2025-05-06): enabled gateway flag, observed live quote refresh in portal/admin while telemetry spans reported success latency (~250ms) and audit log rows appended.
- Failure drill (2025-05-06): toggled `NEXT_PUBLIC_GATEWAY_ENABLED=false`, confirmed polling stopped, UI surfaced maintenance banners, telemetry emitted `network_error` spans, audit log captured outage event, and feature flag change logged for compliance.

## Automated Checks
- `pnpm --filter portal-web test`
- `pnpm --filter admin test`
- `pnpm --filter ui-kit test`
- `pytest services/gateway/tests`
- `uvx --from git+https://github.com/github/spec-kit.git specify check`
