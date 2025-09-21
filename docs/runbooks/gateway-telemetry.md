# Runbook: Gateway Telemetry & Escalation

## Purpose
Ensure the portal and admin applications poll the FastAPI gateway within compliance limits, emit telemetry/audit events, and escalate outages or anomalies promptly.

## Environment & Feature Flag
- Shared client configuration lives in `apps/shared/api/config.ts`.
- Feature flag `NEXT_PUBLIC_GATEWAY_ENABLED` controls whether frontends poll the gateway. Changes require CCO + Head of Engineering approval (see compliance manual §13).
- Polling/backoff values derive from:
  - `NEXT_PUBLIC_GATEWAY_POLL_INTERVAL_MS`
  - `NEXT_PUBLIC_GATEWAY_MAX_BACKOFF_MS`
  - `NEXT_PUBLIC_GATEWAY_RETRY_LIMIT`
- To deploy a change, update `.env.local` (or infrastructure secret) in both `apps/portal-web` and `apps/admin`, run automated tests, and capture approval in the release checklist.

## Monitoring Workflow
1. Open the gateway telemetry dashboard (OpenTelemetry collector) and review:
   - Request latency (p95 target < 1s).
   - Retry count/error rate (<5% sustained for five minutes).
   - Span attributes containing `gateway.retry_delay_ms` for backoff sanity.
2. Tail `services/gateway` structured logs and verify audit events are appended (`data/audit-log.sqlite`). Use `sqlite3 data/audit-log.sqlite "SELECT COUNT(*) FROM audit_log"` to confirm ingestion.
3. Confirm client-side polling respects config: check `getGatewayConfig()` via browser console or `node -e "console.log(require('./apps/shared/dist/apps/shared/api/config.js').readGatewayConfig())"` during debugging.

## Escalation Thresholds
- **Latency breach (>1s p95 for 10 minutes)**: notify Operations lead, open incident bridge, inform CCO.
- **Error rate >5% or repeated `network_error` spans**: pause automated polling (set `NEXT_PUBLIC_GATEWAY_ENABLED=false`), coordinate with backend, document actions.
- **Missing audit events**: escalate to CCO immediately and initiate incident response per compliance §13.

Escalation chain: Frontline engineer → Engineering Manager → CCO → CEO (if compliance cannot resolve within 24 hours).

## Recovery Steps
1. Capture timestamps, affected surfaces, and mitigation steps in an incident doc.
2. After remediation, re-enable the feature flag, deploy updated env config, and confirm telemetry stabilizes.
3. Provide post-incident summary to compliance within 24 hours.

## Verification Checklist
- `pnpm --filter shared test`
- `pnpm --filter portal-web test`
- `pnpm --filter admin test`
- `pytest services/gateway/tests`

Record test output in `specs/002-wire-portal-and/quickstart.md` as evidence when completing the runbook.
