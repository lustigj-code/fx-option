# Research Notes – Make the FX Portal Product Ready and Functioning

## Decision Log

### Portal data hydration strategy
- **Decision**: Use incremental static regeneration for marketing shell while exposures/quotes/hedges pages fetch via server-side calls to the FastAPI gateway using Next.js Route Handlers and React Query for client cache hydration.
- **Rationale**: Keeps hero page snappy for first impressions and leverages streaming data for authenticated surfaces without abandoning Next.js conventions.
- **Alternatives**: Pure client-side fetching (poor SEO, harder to guard errors); full server components only (harder to maintain optimistic UI and polling behaviour).

### Shared API client layer
- **Decision**: Create a typed API client in `apps/portal-web/lib/api` that wraps fetch with retry/backoff, schema validation (zod), and audit logging hooks, reused by Admin via shared package or path alias.
- **Rationale**: Ensures consistent contracts, error handling, and instrumentation across frontends.
- **Alternatives**: Duplicated fetch logic inside each page (risk of drift); moving client into backend services (breaks UI autonomy for polling).

### Authentication and session management
- **Decision**: Bootstrap NextAuth credentials provider now, backed by placeholder identity service, and provide bypass toggle for demos while keeping audit logging in place.
- **Rationale**: Aligns with compliance requirement for authenticated access; leaves room to swap in SSO later.
- **Alternatives**: Anonymous access with URL secrets (non-compliant); building custom auth stack immediately (higher effort, duplicates future identity work).

### Observability & telemetry
- **Decision**: Use browser-side OpenTelemetry instrumentation plus server logs that forward to `services/audit` pipeline; capture key metrics (quote latency, plan fetch timing, hedge submit success).
- **Rationale**: Matches constitution principle IV; uses existing audit/event systems to avoid new infrastructure.
- **Alternatives**: Rely solely on backend logs (miss UI context); postpone telemetry until post-launch (risks blind spots).

## Open Questions
- Clarify production authentication provider timeline to determine whether NextAuth credentials mode is temporary. (Owner: Platform engineering)
- Confirm acceptable polling cadence for exposures/quotes that balances freshness and gateway load. (Owner: Risk operations)
- Determine if payments workflows must appear in MVP or stay hidden until banking integrations stabilize. (Owner: Product)

## References
- `docs/compliance/Supervisory_Procedures.md`
- `services/gateway/app.py`
- `services/risk/service.py`
- `services/pricing-orchestrator/README.md`
