# Data Model – Make the FX Portal Product Ready and Functioning

## Frontend View Models

### ExposureSummary
| Field | Type | Notes |
| --- | --- | --- |
| `currencyPair` | string | ISO pair (e.g., `USDJPY`) normalised by gateway. |
| `netExposure` | string | Human-readable notional (localized). |
| `hedgedPercent` | number | 0–100; derived from risk plan buckets. |
| `policyStatus` | "covered" \| "warning" \| "critical" | Drives badge styling. |
| `updatedAt` | string (ISO timestamp) | Displayed as relative time in UI. |

### QuoteOffer
| Field | Type | Notes |
| --- | --- | --- |
| `dealer` | string | Dealer label displayed in quote cards. |
| `currencyPair` | string | Pair symbol forwarded to execution flow. |
| `midRate` | number | Provided by `/api/quotes/binding`. |
| `spreadBps` | number | Derived from downstream_event payload. |
| `validUntil` | string (ISO) | Drives countdown timers in UI. |
| `best` | boolean | Indicates top-of-book quote for highlighting. |

### HedgePlaybook
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Playbook name. |
| `description` | string | Summary for cards. |
| `coverage` | number | Percentage coverage vs policy target. |
| `drift` | number | Positive indicates over-hedged. |
| `alerts` | number | Count of outstanding alerts. |
| `nextAction` | string | ISO date or descriptive string. |

### AuditEvent
| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | UUID from audit service. |
| `actor` | string | User triggering the event. |
| `type` | string | e.g., `QUOTE_REQUESTED`, `HEDGE_SCHEDULED`. |
| `payload` | Record<string, unknown> | JSON payload stored in audit chain. |
| `createdAt` | string (ISO) | Display/time-sort field. |

## Gateway Contracts

### GET `/api/risk/plan`
- **Request**: `RiskPlanRequest` schema (quotes[], exposures[], optional hedges[]).
- **Response**: `RiskPlanResponse` (buckets[], execution_plan[], netting_savings).
- **Used by**: Portal exposures dashboard, admin risk summary.

### POST `/api/quotes/binding`
- **Request**: `BindingQuoteRequest` (id, currency_pair, notional, strike, tenor_days, market_data).
- **Response**: `BindingQuoteResponse` with downstream_event for audit.
- **Used by**: Quotes comparison module and audit logging.

### POST `/api/execution/orders`
- **Request**: `ExecutionOrderRequest` with dry_run controls.
- **Response**: `ExecutionResponse` (fills, order metadata).
- **Used by**: Hedge scheduling and admin oversight.

## Admin Oversight Models

### EscalationTask
| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Derived from policy breach. |
| `severity` | "warning" \| "critical" | Controls badge styling. |
| `source` | string | e.g., `risk-plan`, `policy-engine`. |
| `message` | string | Summary displayed in admin events table. |
| `createdAt` | string (ISO) | Ordering. |
| `status` | "open" \| "acknowledged" \| "resolved" | Drives CTA buttons. |

## Relationships
- `ExposureSummary` is derived from gateway risk plan aggregates and audit events tracking policy breaches.
- `QuoteOffer` originates from pricing orchestrator results; best quote flagged for quick action.
- `HedgePlaybook` references execution orders produced via `/api/execution/orders` and policy thresholds defined in docs.
- `AuditEvent` and `EscalationTask` feed the admin workspace to complete the compliance loop.
