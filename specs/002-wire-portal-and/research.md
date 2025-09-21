# Research Notes – Wire portal/admin to FastAPI gateway

## Decision Log

### Shared client architecture
- **Decision**: Build a client module under `apps/shared/api` (exported via workspace alias) that wraps `fetch`, applies standardized headers, retries, and integrates zod validation + telemetry.
- **Rationale**: Avoid duplicated logic between portal and admin; centralizes instrumentation and error handling.
- **Alternatives**: Embed client per app (higher drift risk) or rely on backend proxies (less flexibility in UI).

### Polling cadence & backoff
- **Decision**: Default to 10s polling for exposures and quotes, adjustable via env; use exponential backoff (up to 60s) on errors with jitter, abort after 3 consecutive failures and surface alert.
- **Rationale**: Balances real-time feel with gateway SLA (<200ms p95, limited load).
- **Alternatives**: WebSockets (overhead, not yet supported), manual refresh (poor UX).

### Telemetry stack
- **Decision**: Use OpenTelemetry JS SDK + custom audit hook to send logs to `services/audit`; match backend metrics for latency and error rate.
- **Rationale**: Aligns with constitution principle IV and compliance needs.
- **Alternatives**: Custom logging (reinventing instrumentation), defer telemetry (non-compliant).

## Open Questions
- Confirm final SLA/limits from backend team (requests per minute, concurrency).  
- Determine authentication token refresh approach for NextAuth client.  
- Decide whether to expose debug telemetry dashboard inside admin app.

## References
- `services/gateway/app.py`, `services/gateway/schemas.py`
- `docs/compliance/Supervisory_Procedures.md`
- OpenTelemetry JS docs
