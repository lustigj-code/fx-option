# Changelog – Gateway Client Enablement

## Summary
- Introduced shared OpenTelemetry-instrumented gateway client (`apps/shared/api/client.ts`).
- Refactored portal/admin API layers to use shared client and UI status primitives.
- Added feature flag (`NEXT_PUBLIC_GATEWAY_ENABLED`) and configuration helpers for polling/backoff.
- Forwarded gateway telemetry logs to audit repository and documented compliance/runbook procedures.

## Deployment Plan
1. Confirm staging environment telemetry dashboards and audit log ingestion are healthy.
2. Obtain written approval from CCO and Head of Engineering to enable `NEXT_PUBLIC_GATEWAY_ENABLED` in production.
3. Roll out environment changes (portal/admin) during low-traffic window with on-call coverage from Operations + Backend.
4. Monitor telemetry dashboard and audit DB for the first hour post-enable; revert flag if error rate >5% or latency >1s.

## Communication Plan
- **Pre-launch briefing:** Notify Operations, Support, and Compliance one week prior with summary of changes and runbook link (`docs/runbooks/gateway-telemetry.md`).
- **Launch announcement:** Post Slack update in #ops and #compliance when flag is enabled, including monitoring owner and rollback steps.
- **Follow-up:** Share 24-hour stability summary with leadership and archive incident-free evidence in compliance records.
