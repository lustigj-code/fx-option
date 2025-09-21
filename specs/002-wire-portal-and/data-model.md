# Data Model – Gateway client integration

## TypeScript Contracts

### BindingQuoteResponse (portal/admin)
- `exposureId: string`
- `price: number`
- `pricingModel: string`
- `validUntil: string`
- `impliedVolatility: number`
- `cap: number`
- `safetyBufferSeconds: number`
- `latencyMs: number`
- `downstreamEvent?: QuoteMessage`

### RiskPlanResponse
- `buckets: RiskBucket[]`
- `executionPlan: ExecutionPlanItem[]`
- `nettingSavings: NettingSavings`

### ExecutionResponse
- Mirror existing storage model with fills, order metadata, dryRun flag.

## Shared Telemetry Event
```
interface GatewayTelemetry {
  endpoint: 'quotes' | 'risk-plan' | 'execution';
  latencyMs: number;
  status: 'success' | 'error';
  errorCode?: string;
  userId: string;
  timestamp: string;
}
```
