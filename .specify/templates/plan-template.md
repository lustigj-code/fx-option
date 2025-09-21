# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

## Execution Flow (/plan scope)
```
1. Load spec.md → abort if missing.
2. Extract tech surfaces (portal, admin, ui-kit, gateway, services, docs).
3. Pull constitution guardrails from `.specify/memory/constitution.md` and assert compliance.
4. Resolve unknowns via research.md; stop if `[NEEDS CLARIFICATION]` remain.
5. Produce:
   - research.md (constraints, references, open questions resolved)
   - data-model.md (entities, contracts)
   - quickstart.md (manual QA + telemetry steps)
   - contracts/ (OpenAPI schemas, TypeScript interfaces, protocol docs)
6. Update `.codex/commands` guidance if new workflows introduced.
7. Stop before generating tasks (handled by /tasks).
```

## Summary
[Two paragraphs: business context and high-level technical approach]

## Technical Context
**Frontend**: [portal/admin components, Next.js version, shared UI kit pieces]  
**Backend**: [gateway services, pricing, risk, payments usage]  
**APIs & Contracts**: [gateway endpoints, new service protocols]  
**Compliance Touchpoints**: [links to docs/compliance/*, audit chain impacts]  
**Testing**: [pnpm storybook/test flows, pytest targets, contract tests]  
**Observability**: [metrics/log events, dashboards to update]

## Constitution Check
- Restate relevant principles, document how the plan complies, and flag conflicts with `[NEEDS CLARIFICATION]`.

## Project Structure
```
apps/portal-web/
  app/
  components/
  lib/
apps/admin/
  app/
  components/
  lib/
packages/ui-kit/
  src/
services/
  gateway/
  pricing-orchestrator/
  risk/
  payments/
  connectors/
  execution/
docs/
  compliance/
  connectors/
```
- Describe where new files live (TSX components, hooks, API clients, Python modules, documentation).

## Phase 0 – Research
- Enumerate open questions, external dependencies, performance targets.
- Document findings in `research.md` with Decision / Rationale / Alternatives.

## Phase 1 – Design & Contracts
- **Data Model**: Entities and state transitions across frontend/backends.
- **Contracts**: API shapes (TypeScript types + OpenAPI/JSON schema).
- **Quickstart**: Step-by-step validation plan (build commands, local env, QA).
- **Agent Guidance**: Run `.specify/scripts/bash/update-agent-context.sh codex` to keep AI context current.

## Phase 2 – Task Strategy (for /tasks command)
- Define sequencing assumptions (frontend-first vs backend-first).
- List gating requirements before tasks can run (mock data availability, compliance review, design sign-off).

## Review Checklist
- [ ] Constitution principles satisfied or mitigation documented.
- [ ] All impacted surfaces have design notes.
- [ ] Contracts documented for every integration point.
- [ ] Quickstart covers manual QA + telemetry verification.

## Progress Tracking
- [ ] Research complete
- [ ] Contracts generated
- [ ] Quickstart drafted
- [ ] Constitution re-check passed
