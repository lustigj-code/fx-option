# Implementation Plan: Make the FX Portal Product Ready and Functioning

**Branch**: `[001-make-the-fx]` | **Date**: 2025-08-13 | **Spec**: specs/001-make-the-fx/spec.md
**Input**: Feature specification from `/specs/001-make-the-fx/spec.md`

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
The FX Portal must graduate from demo UI to a production-ready experience that connects treasury workflows to real gateway data, admin oversight, and compliance instrumentation. We will stabilise the front-end surfaces (marketing shell, exposures, quotes, hedges) with authenticated navigation, responsive layouts, and accessible components delivered through the shared UI kit.

Backend services already expose binding quotes, risk plans, and execution endpoints; this plan introduces a typed client layer, improved error handling, and audit propagation so every user action is captured for compliance. Observability hooks and dry-run safeguards will ensure the portal operates safely until live trading is authorised.

## Technical Context
**Frontend**: Next.js 13.5 (portal) & 14.2 (admin) using React 18, Tailwind, NextAuth, shared `ui-kit`; new work will add server route handlers, React Query for polling, Storybook coverage, and accessibility linting.  
**Backend**: FastAPI gateway (`services/gateway`) federating pricing orchestrator, risk service, execution_sync; services run on Python 3.11 with Pydantic schemas.  
**APIs & Contracts**: `/api/quotes/binding`, `/api/risk/plan`, `/api/execution/orders` (see `services/gateway/schemas.py`); need TypeScript mirrors validated with zod.  
**Compliance Touchpoints**: Supervisory procedures require audit trails and escalation workflows; portal/admin actions must append to `services/audit` chain and respect escalation chain defined in docs.  
**Testing**: pnpm lint/test for portal, admin, ui-kit; Storybook visual tests; pytest for services (pricing, risk, gateway) plus contract tests hitting FastAPI endpoints.  
**Observability**: Browser OpenTelemetry instrumentation + server logs forwarded to audit service; metrics for quote latency and risk plan generation.

## Constitution Check
- **Spec-Driven Delivery**: Spec, plan, research, and quickstart committed before coding—compliant.
- **Compliance-Centric Design**: Plan references supervisory procedures and audit logging; pending confirmation of polling cadence (flagged in research).  
- **One UI Language**: All UI changes routed through `packages/ui-kit`; plan mandates new primitives/stories before portal/admin adoption.  
- **Test-First & Observability**: Tasks will generate tests prior to implementation and add telemetry; Quickstart includes automated checks.  
- **Resilient Integrations**: API client layer introduces retry/backoff and failure UX; outstanding questions around polling cadence tracked as TODO.  

## Project Structure
```
apps/portal-web/
  app/
  components/
  lib/api/
apps/admin/
  app/
  components/
  lib/api/
packages/ui-kit/
  src/components/
services/
  gateway/
  pricing-orchestrator/
  risk/
  audit/
docs/
  compliance/
  connectors/
specs/001-make-the-fx/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/
```
New files will be added to `apps/*/lib/api` for clients, `packages/ui-kit/src/components` for shared primitives, and `specs/001-make-the-fx/contracts/` for schema definitions.

## Phase 0 – Research
- Finalise authentication approach (NextAuth credentials vs upcoming SSO).
- Document acceptable polling cadence and backoff policy with risk ops.
- Validate telemetry stack (browser OTEL + audit service) with SRE/compliance.
- Capture answers in `research.md`; block implementation until open questions resolved.

## Phase 1 – Design & Contracts
- Produce TypeScript interfaces + zod schemas mirroring gateway requests/responses; store under `specs/001-make-the-fx/contracts/` and reference in code via codegen or manual import.
- Expand `data-model.md` with view models for ExposureSummary, QuoteOffer, HedgePlaybook, AuditEvent (done) and keep updated when fields change.
- Update `quickstart.md` with QA steps, telemetry validation, and automated check list (done, revise as research closes).
- Refresh `.codex/commands/plan.md` if new workflows (e.g., API client scaffolding) require agent hints (none currently).

## Phase 2 – Task Strategy (for /tasks command)
- Frontend-first sequencing: tests for ui-kit/portal/admin before implementation; backend client + telemetry tasks follow once tests failing.
- Blockers before `/tasks`: resolve research questions, commit TypeScript contracts, and ensure quickstart covers compliance validation.
- `/tasks` will then emit setup, test, implementation, integration, and polish work with explicit file paths (apps/portal-web/app/*, apps/admin/app/*, packages/ui-kit/src/*, services/gateway/*, docs/compliance/*).

## Review Checklist
- [x] Constitution principles satisfied or mitigation documented.
- [x] All impacted surfaces have design notes.
- [x] Contracts documented for every integration point (TypeScript schemas pending in contracts/ step).
- [x] Quickstart covers manual QA + telemetry verification.

## Progress Tracking
- [x] Research complete (initial decisions, outstanding questions logged)
- [x] Contracts generated (skeleton via data-model, TypeScript/Zod to be drafted in contracts/ during implementation)
- [x] Quickstart drafted
- [x] Constitution re-check passed
