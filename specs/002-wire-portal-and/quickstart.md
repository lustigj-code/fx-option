# Quickstart – Gateway client integration

## Prerequisites
- Node 18+, pnpm
- FastAPI gateway running locally
- OpenTelemetry collector (optional) for local telemetry testing

## Setup
1. `pnpm install`
2. `pnpm --filter portal-web dev --hostname 0.0.0.0`
3. `pnpm --filter admin dev --hostname 0.0.0.0`
4. `uvicorn services.gateway.app:app --reload`

## Verification
- Portal exposures/quotes update every 10s, handle gateway outage gracefully.
- Admin dashboards reflect same data with error banners during outage.
- Telemetry logs show latency metrics and error events.
- Audit trail records user actions with endpoint metadata.

## Automated Checks
- `pnpm --filter portal-web test`
- `pnpm --filter admin test`
- `pnpm --filter ui-kit test`
- `pytest services/gateway/tests`
- `uvx --from git+https://github.com/github/spec-kit.git specify check`
