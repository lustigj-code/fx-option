# Secure Authentication & RBAC Release Notes

## 2025-08-13

- Implemented shared audit event logger and FastAPI ingestion service with `/events/auth` review endpoint.
- Added NextAuth lockout policy with configurable thresholds, MFA enforcement, and audit emission of `ACCOUNT_LOCKED` events.
- Refactored portal/admin middleware to emit access-denied telemetry and updated UI kit login/access components.
- Documented authentication controls, MFA escalation procedures, and QA evidence in the Supervisory Procedures and Quickstart.
