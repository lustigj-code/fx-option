# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "$ARGUMENTS"

## Executive Summary *(mandatory)*
- **Goal**: What problem this feature solves for treasury or ops stakeholders.
- **Primary Users**: Identify user personas (e.g., portfolio manager, compliance analyst, operations desk).
- **Success Criteria**: Quantifiable outcomes (engagement, risk coverage, latency, compliance signal).
- **Surfaces Impacted**: `portal`, `admin`, `ui-kit`, `gateway`, `services/*`, `docs/*`.

## User Scenarios & Testing *(mandatory)*

### Primary User Story
[Describe the main user journey in plain language]

### Secondary Stories
- [Story 2 summary]
- [Story 3 summary]

### Acceptance Scenarios
1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

### Edge & Failure Cases
- How do we handle empty data, slow gateway responses, or authentication failures?
- What happens when regulatory flags or policy breaches occur?

## Functional Requirements *(mandatory)*
- **FR-001**: System MUST [...]
- **FR-002**: Portal frontend MUST [...]
- **FR-003**: Admin frontend MUST [...]
- **FR-004**: Shared UI kit MUST [...]
- **FR-005**: Backend services MUST [...]
- **FR-006**: Compliance MUST [...]
- Mark unclear requirements with `[NEEDS CLARIFICATION: question]`.

## Data & Contract Considerations *(optional)*
- Key API contracts (gateway endpoints, new services).
- Required schema updates, event payloads, audit trails.
- Dependencies on external providers (IBKR, Stripe, QuickBooks, etc.).

## UX & Content Notes *(optional)*
- Visual hierarchy, responsive behaviour, accessibility requirements.
- Copywriting updates for marketing shell or admin tooltips.

## Risk & Controls *(mandatory when workflows touch compliance or trading)*
- Reference `docs/compliance/Supervisory_Procedures.md` requirements.
- Traceability plan for audit logging and approval flows.
- Performance, resiliency, and security constraints.

## Rollout & Metrics *(optional)*
- Launch gating (feature flags, cohorts, manual QA).
- Telemetry or audit signals to monitor success.

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
