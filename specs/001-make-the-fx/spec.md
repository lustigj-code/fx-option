# Feature Specification: Make the FX Portal Product Ready and Functioning

**Feature Branch**: `[001-make-the-fx]`  
**Created**: 2025-08-13  
**Status**: Draft  
**Input**: User description: "make the fx portal product ready and functioning"

## Executive Summary *(mandatory)*
- **Goal**: Deliver a production-ready FX Portal that lets treasury teams monitor exposures, compare binding quotes, configure hedge playbooks, and action execution without leaving the workspace.
- **Primary Users**: Corporate treasury managers, risk analysts, and operations controllers responsible for FX hedging programs.
- **Success Criteria**:  
  - ≥90% of targeted workflows (exposure monitoring, quote comparison, hedge oversight) reachable from portal navigation without manual refreshes.  
  - Time-to-first-binding-quote < 5 seconds with real gateway data in dry-run mode.  
  - All critical user actions emit audit entries reviewable by compliance within 24 hours.  
  - Storybook and automated tests cover all new UI states with no accessibility violations (axe score 100%).
- **Surfaces Impacted**: `portal`, `admin`, `ui-kit`, `gateway`, `services/risk`, `services/pricing-orchestrator`, `services/audit`, `docs/compliance`.

## User Scenarios & Testing *(mandatory)*

### Primary User Story
A treasury manager signs into the portal, reviews currency exposures, compares live dealer quotes for a high-priority exposure, and schedules an automated hedge playbook that aligns with governance thresholds, all without encountering mock data or broken flows.

### Secondary Stories
- A risk analyst drills into exposure-level risk plans, exports the plan, and validates that performance targets and guardrails are met before approving execution.
- An operations controller verifies audit trails and policy compliance for portal-triggered actions, confirming that alerts and approvals reach the admin workspace.

### Acceptance Scenarios
1. **Given** a signed-in treasury manager with linked programs, **When** they open `/exposures`, **Then** they see real data sourced from the gateway with accurate hedged percentages, policy flags, and last-updated timestamps.
2. **Given** a user comparing quotes on `/quotes`, **When** the user requests binding quotes for a selected exposure, **Then** the UI displays dealer quotes from the gateway, highlights best spread, and logs the action for audit review.

### Edge & Failure Cases
- Gateway returns empty datasets or 500 errors → portal shows skeleton/loading states, retries within defined budgets, and surfaces banners prompting the user to view system status.
- Authentication token expires mid-session → redirect to login with state preserved, and log the event for security review.
- Compliance flags a policy breach (e.g., hedge ratio drift) → portal renders escalation banner and creates an admin task for follow-up.

## Functional Requirements *(mandatory)*
- **FR-001**: System MUST provide authenticated access to all portal routes backed by real data sources, removing placeholder datasets.
- **FR-002**: Portal frontend MUST render real-time exposures, quotes, and hedge playbooks with loading, empty, and error states driven by gateway responses.
- **FR-003**: Admin frontend MUST receive and display audit events, escalations, and approval workflows triggered from portal actions to complete loop-through oversight.
- **FR-004**: Shared UI kit MUST expose production-ready components (tables, cards, alerts, modals) with responsive and accessible variants used by portal/admin.
- **FR-005**: Backend services MUST deliver stable, contract-tested endpoints (`/api/quotes/binding`, `/api/risk/plan`, `/api/execution/orders`) with latency under agreed SLAs and structured audit outputs.
- **FR-006**: Compliance MUST receive traceable logs for every quote request, plan approval, and hedge trigger, mapped to supervisory procedures with retention ≥5 years.
- **FR-007**: Observability MUST capture telemetry (metrics, traces, logs) for key user flows to detect regressions before go-live.

## Data & Contract Considerations *(optional)*
- Formalize TypeScript client contracts for gateway endpoints and align with FastAPI schemas in `services/gateway/schemas.py`.
- Ensure pricing orchestrator and risk plan models expose the data fields needed for UI scenarios (e.g., hedged %, VaR deltas, quote spreads).
- Audit events must serialize into the existing audit chain format (`services/audit`) for downstream ingestion.
- Stripe/dLocal/Wise integrations remain mocked for demo but require safe fallbacks until real credentials are configured.

## UX & Content Notes *(optional)*
- Marketing home evolves into onboarding CTA plus in-product navigation—update copy to emphasise program readiness and compliance assurances.
- Exposures/Quotes/Hedges grids adopt consistent spacing, typography, and hover states from UI kit tokens; ensure mobile breakpoints maintain readability.
- Provide contextual tooltips and help links from portal surfaces to relevant docs under `docs/`.
- Implement global notifications/toasts for execution results and policy alerts.

## Risk & Controls *(mandatory when workflows touch compliance or trading)*
- Map every user action to `docs/compliance/Supervisory_Procedures.md` steps (e.g., quote approvals, escalation chain) and document sign-offs in quickstart/runbook.
- Enforce role-based access to portal/admin features; unauthorized access attempts must be logged and surfaced to compliance.
- Implement retry/backoff and circuit breakers for gateway integration; persistent failures trigger alerts to operations.
- Maintain dry-run mode safeguards to avoid unintended live trades; switchovers require dual-approval documented in admin workspace.

## Rollout & Metrics *(optional)*
- Launch behind a feature flag with pilot treasury teams; expand once telemetry shows target satisfaction thresholds.
- Track metrics: page load performance, quote request success rate, hedge automation adoption, compliance breach resolution time.
- Require manual QA sign-off replicating primary and secondary stories before flag lift.

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
