<!--
Sync Impact Report
Version change: 0.0.0 → 1.0.0
Modified principles: N/A (initial ratification)
Added sections: Core Principles, Execution Safeguards, Delivery Workflow, Governance
Templates requiring updates: 
  ✅ .specify/templates/spec-template.md
  ✅ .specify/templates/plan-template.md
  ✅ .specify/templates/tasks-template.md
  ⚠️ docs/ (add cross-links when new specs land)
Deferred TODOs: None
-->

# FX Option Platform Constitution

## Core Principles

### I. Spec-Driven Delivery
Every user-facing or service change begins with a `/specify` document that captures business intent, user journeys, and measurable success criteria. Features may not proceed to `/plan` or implementation until the spec is reviewed and all `[NEEDS CLARIFICATION]` items are resolved.

### II. Compliance-Centric Design
All workflows must evidence adherence to the controls documented in `docs/compliance/`. Specs and plans explicitly trace how regulatory, audit, and supervisory requirements are satisfied. Any deviation requires compliance sign-off before merge.

### III. One UI Language
`packages/ui-kit` is the source of truth for visual primitives. Portal (`apps/portal-web`) and Admin (`apps/admin`) surfaces consume reusable components, tokens, and theming from the kit. Net-new UI requires accompanying kit components, stories, and accessibility checks before adoption.

### IV. Test-First & Observability
Automated tests precede implementation. Frontend changes ship with Storybook stories and component tests; backend updates include pytest coverage and contract tests. Production paths emit structured logs, metrics, and audit events so that behaviour is observable end-to-end.

### V. Resilient Integrations
Integrations with the FastAPI gateway and downstream services degrade gracefully. Plans document retry/backoff, timeout budgets, and UX fallbacks for partial outages. Telemetry must surface failures to operations dashboards.

## Execution Safeguards
- Performance targets: Gateway endpoints uphold <200 ms p95 during dry-run mode; frontend interactions maintain <100 ms TTI for critical dashboards.
- Security: Admin workflows enforce role-based access and never expose raw counterpart identifiers. Portal data loads must respect least-privilege gateway scopes.
- Data governance: Events touching pricing, risk, payments, or connectors emit audit records via `services/audit` pipelines.

## Delivery Workflow
- `/specify` → spec.md with stakeholder narrative and compliance traceability.
- `/plan` → research.md, data-model.md, quickstart.md, contracts/ reflecting the repo structure listed in `README.md`.
- `/tasks` → numbered work items prioritising tests, then implementation, then polish. Tasks reference concrete file paths and required commands (`pnpm`, `pytest`, `uvx`).
- No merge may occur without `uvx ... specify check`, `pnpm lint`, `pnpm test`, and `pytest` succeeding.

## Governance
- Constitution changes require product, engineering, and compliance approval. Bumps follow semver based on scope of change.
- Compliance conducts quarterly audits against this constitution and the linked supervisory procedures.
- Runtime guidance (agent files, onboarding docs) must be updated within the same branch when principles or safeguards change.

**Version**: 1.0.0 | **Ratified**: 2025-08-13 | **Last Amended**: 2025-08-13
