# Data Model – Auth & RBAC

## UserSession (JWT Payload)
| Field | Type | Notes |
| --- | --- | --- |
| `sub` | string | User identifier (UUID/email). |
| `name` | string | Display name for UI. |
| `email` | string | For notifications/audit reference. |
| `roles` | string[] | Allowed roles (`treasury_manager`, `risk_analyst`, `compliance_officer`, `admin`). |
| `mfaVerified` | boolean | Indicates MFA enrollment status. |
| `exp` | number | Epoch expiry time. |

## AuditAuthEvent
| Field | Type | Notes |
| --- | --- | --- |
| `eventType` | "LOGIN_SUCCESS" \| "LOGIN_FAILURE" \| "LOGOUT" \| "ACCESS_DENIED" \| "ROLE_CHANGE" |
| `userId` | string | Mapped from `sub`. |
| `roles` | string[] | Roles at time of event. |
| `ip` | string | Optional IP address. |
| `userAgent` | string | For security review. |
| `metadata` | object | Additional info (e.g., route attempted, reason). |
| `timestamp` | string ISO | Audit timestamp.

## RBAC Policy Matrix
- `treasury_manager`: portal exposures, quotes, hedges; cannot access admin.
- `risk_analyst`: portal exposures, risk plans; read-only admin dashboards.
- `compliance_officer`: portal read-only + admin audit/alerts. Requires MFA.
- `admin`: full portal/admin plus role management.

## MFA Enrollment Entity
| Field | Type | Notes |
| --- | --- | --- |
| `userId` | string | Owner. |
| `secret` | string | Encrypted TOTP secret. |
| `recoveryCodes` | string[] | Encrypted. |
| `verifiedAt` | string | ISO timestamp. |

## API Contracts (Auth Service)
- POST `/api/auth/signup` (future) – placeholder for credential bootstrap.
- POST `/api/auth/mfa/enroll` – returns secret/qr metadata.
- POST `/api/auth/mfa/verify` – verifies token; sets `mfaVerified` flag.
- Middleware: Next.js API route verifying JWT + roles before hitting gateway.
