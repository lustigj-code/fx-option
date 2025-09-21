# Research Notes – Secure Authentication & RBAC

## Decision Log

### Authentication Provider Strategy
- **Decision**: Adopt NextAuth with Credentials provider for demo/local and design abstraction to swap in SSO (OIDC/SAML) in production. Store provider config in `.env` while wrapping session callbacks to issue JWT with role claims.
- **Rationale**: Enables immediate secure login flows while future-proofing for enterprise identity integrations.
- **Alternatives**: Build custom auth (higher maintenance) or delay SSO integration (blocks compliance launch).

### Role Model & Authorization Layer
- **Decision**: Define canonical roles (`treasury_manager`, `risk_analyst`, `compliance_officer`, `admin`) stored with users in identity service; enforce route-level guards via Next.js middleware and shared hook (`useAuthorization`).
- **Rationale**: Centralized role logic reduces duplication and ensures consistent enforcement across portal/admin.
- **Alternatives**: Client-side checks only (weak security), backend-only checks (poor UX without front-end awareness).

### MFA & Session Controls
- **Decision**: Integrate Time-based One-Time Password (TOTP) workflow placeholder backed by server endpoints for enrollment/verification; require MFA on admin routes and privileged portal actions.
- **Rationale**: Meets compliance expectations even if real provider to follow.
- **Alternatives**: Postpone MFA (non-compliant) or rely on email codes (slower, less secure).

## Open Questions
- Alignment with identity roadmap: target SSO provider and timeline? (Product/security input)
- What is the required session timeout and inactivity lock policy? (Compliance sign-off)
- Storage location for MFA secrets/backup codes (encrypted DB? external vault?). Pending infra decision.

## References
- NextAuth docs (role-based authorization, callbacks)
- `docs/compliance/Supervisory_Procedures.md`
- Existing audit service (`services/audit`)
