# Implementation Plan: Secure Authentication & RBAC

**Branch**: `[003-implement-secure-authentication]` | **Date**: 2025-08-13 | **Spec**: specs/003-implement-secure-authentication/spec.md
**Input**: Feature specification from `/specs/003-implement-secure-authentication/spec.md`

## Execution Flow (/plan scope)
```
1. Verify spec completeness and constitution compliance.
2. Document research decisions, data model, quickstart (done).
3. Prepare contracts/ for auth-related schemas (pending).
4. Enumerate tasks (via /tasks) covering tests → implementation → compliance docs.
```

## Summary
We will implement secure authentication across portal and admin using NextAuth, introduce role-based access control with defined role matrix, enforce MFA for privileged roles, and ensure every auth event is logged in the audit service. Frontend work introduces guarded routes, UI kit components for login/access denied states, and compliance messaging. Backend services handle JWT validation, role enforcement, and audit hooks.

## Technical Context
**Frontend**: Next.js 13/14 apps with NextAuth, middleware, React context for session/role; UI kit enhancements for auth views.  
**Backend**: Identity mocked via NextAuth Credentials provider; future SSO readiness with OIDC. Gateway may validate JWT scopes.  
**APIs & Contracts**: NextAuth callbacks, potential `/api/auth/mfa/*` endpoints, audit logging contract.  
**Compliance Touchpoints**: Supervisory procedures require access logs, MFA, and role controls.  
**Testing**: Jest/RTL for auth components, Cypress/Playwright (optional) for flow, pytest for audit service.

## Constitution Check
- Spec-driven ✓
- Compliance-centric ✓ (audit logging, MFA) – pending answers on session timeout.
- One UI language ✓ (auth components in ui-kit)
- Test-first ✓ (auth tests before implementation)
- Resilient integrations ✓ (handling session expiry, lockouts)

## Project Structure
```
apps/shared/auth/
  session.ts
  roles.ts
apps/portal-web/
  app/(auth)/login
  middleware.ts
apps/admin/
  app/(auth)/login
  middleware.ts
packages/ui-kit/
  src/components/auth/*
services/audit/
  events/auth.py
services/gateway/
  security/auth_middleware.py
specs/003-implement-secure-authentication/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/
```

## Phase 0 – Research
- Resolve open questions (SSO roadmap, session policy, MFA secret storage) before implementation tasks begin.

## Phase 1 – Design & Contracts
- Draft contract definitions for JWT payload, MFA endpoints, audit events under `contracts/`.  
- Design role matrix and enforcement strategy (documented in data model).  
- Update `.codex/commands` if additional workflow guidance needed (e.g., /implement auth tasks). None currently.

## Phase 2 – Task Strategy (for /tasks)
- Tests: add auth unit/integration tests before implementing UI/logic.  
- Implementation: configure NextAuth, create shared auth module, guard routes, integrate MFA.  
- Backend: audit logging, gateway middleware.  
- Documentation: update compliance procedures, quickstart evidence.

## Review Checklist
- [x] Research doc created
- [x] Data model defined
- [x] Quickstart drafted
- [ ] Contracts to be added before tasks (/tasks will require gateway/auth schemas)

## Progress Tracking
- [x] Research
- [x] Data model
- [x] Quickstart
- [ ] Contracts (TODO)
