# Feature Specification: Wire portal and admin frontends to the FastAPI gateway with shared client, polling rules, and error/telemetry handling

**Feature Branch**: `[002-wire-portal-and]`  
**Created**: 2025-08-13  
**Status**: Draft  
**Input**: User description: "Wire portal and admin frontends to the FastAPI gateway with shared client, polling rules, and error/telemetry handling"

## Executive Summary *(mandatory)*
- **Goal**: Deliver a shared API access layer and operational policies so the portal and admin UIs consume live data from the FastAPI gateway reliably, gracefully handling latency, errors, and telemetry requirements.
- **Primary Users**: Frontend engineers building portal/admin surfaces; operations staff relying on accurate, up-to-date exposures, quotes, and audit trails.
- **Success Criteria**:  
  - Shared TypeScript client with schema validation covers all gateway endpoints used by the UIs.  
  - Polling/backoff rules keep data fresh without breaching gateway SLAs.  
  - UI surfaces display consistent loading, empty, and error states, with audit logs emitted for critical interactions.  
  - Observability instrumentation captures latency, error rate, and user actions for compliance review.
- **Surfaces Impacted**: `portal`, `admin`, `ui-kit`, `services/gateway`, `services/audit`, `docs/compliance`.

## User Scenarios & Testing *(mandatory)*

### Primary User Story
A treasury manager in the portal sees real-time exposures and quotes sourced from the gateway, with the UI smoothly handling data refresh, timeout, and error cases while logging interactions for audit.

### Secondary Stories
- An admin analyst reviews escalations and audit logs in the admin app, fed by the same shared client and telemetry hooks.  
- Engineering runbook monitors telemetry dashboards to ensure polling cadence and error handling stay within compliance and performance budgets.

### Acceptance Scenarios
1. **Given** the portal exposures page, **When** the gateway responds successfully, **Then** the data updates without stale cache, and audit logs register refreshes.  
2. **Given** a gateway timeout or error, **When** the portal/admin retries within prescribed limits, **Then** it shows non-blocking banners, logs the incident, and resumes polling once the gateway recovers.

### Edge & Failure Cases
- Network partition causing repeated timeouts → client backs off, surfaces status banner, and logs to audit/telemetry.  
- Gateway returns validation error → TypeScript client rejects and triggers UI fallback with support contact.  
- Admin session expires → client aborts requests, triggers relogin, and records the event for security review.

## Functional Requirements *(mandatory)*
- **FR-001**: System MUST provide a shared, typed API client for portal and admin frontends with schema validation and typed responses.  
- **FR-002**: Portal frontend MUST implement polling policies, retry/backoff, and consistent UX for loading/empty/error states across exposures, quotes, and hedges.  
- **FR-003**: Admin frontend MUST consume the same client and telemetry hooks for audit/oversight views with consistent error handling.  
- **FR-004**: Shared UI kit MUST expose loading skeletons, banners, and error components aligned with polling/error states.  
- **FR-005**: Gateway MUST enforce SLA-friendly rate limits and emit structured logs consumed by telemetry dashboards.  
- **FR-006**: Compliance MUST have linkage between user-triggered gateway calls and audit logs for traceability.

## Data & Contract Considerations *(optional)*
- Mirror `services/gateway/schemas.py` into TypeScript (zod) contracts with versioning to detect drift.  
- Document polling cadence, rate limits, and concurrency constraints; ensure clients read them from config.  
- Audit events should include endpoint metadata, response times, and user identifiers.

## UX & Content Notes *(optional)*
- Portal/admin share skeleton components, inline alerts, and toast notifications for error recovery.  
- Provide inline help/tooltips explaining data freshness and escalation steps.

## Risk & Controls *(mandatory when workflows touch compliance or trading)*
- Polling and retries must respect compliance thresholds; repeated failures escalate to admin for manual intervention.  
- Telemetry instrumentation provides compliance visibility into quote requests and risk plan retrieval.  
- Authentication failure handling prevents unauthorized access attempts from silently bypassing audit.

## Rollout & Metrics *(optional)*
- Deploy behind feature flag; monitor telemetry (latency, success rate, error rate) before full rollout.  
- Gate release on alert-free run and compliance sign-off.

---

## Review Checklist
- [ ] All user stories cover happy path and failure modes.
- [ ] Requirements are testable and aligned with success criteria.
- [ ] Compliance and audit obligations addressed.
- [ ] No implementation details (framework internals, database schema) unless required by compliance.
- [ ] All `[NEEDS CLARIFICATION]` resolved or called out for follow-up.

## Execution Status *(auto-updated by commands)*
- [ ] User description parsed
- [ ] Scenarios documented
- [ ] Requirements mapped
- [ ] Risks addressed
- [ ] Review checklist passed
