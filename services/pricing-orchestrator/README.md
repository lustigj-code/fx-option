# Pricing Orchestrator Service

This service coordinates market data retrieval, pricing, persistence, and event emission for binding FX option quotes. It listens for `ExposureCreated` events, enriches them with spot, implied volatility, and rate information, and then delegates price calculation to the configured pricing engine. Quotes are persisted with a strict two-minute validity window and a configurable safety buffer before notifying downstream systems via the message bus.

## Key behaviours

* Enforces the business default of a **5% cap when implied volatility is below 2%**.
* Quotes have a validity of 120 seconds; consumers are expected to respect the configured safety buffer to avoid stale execution.
* Captures and raises when the 99th percentile SLA of 200ms is breached to surface operational issues early.
* Produces a graceful manual-intervention message when the required market data is unavailable.

## Tests

Run the test suite with:

```bash
python -m pytest services/pricing-orchestrator/tests
```
