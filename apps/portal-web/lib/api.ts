const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  return response.json() as Promise<T>;
}

export interface BindingQuotePayload {
  id: string;
  currency_pair: string;
  notional: number;
  strike: number;
  tenor_days: number;
  market_data: {
    spot: number;
    implied_volatility: number;
    interest_rate: number;
  };
}

export interface BindingQuoteResponse {
  exposure_id: string;
  price: number;
  pricing_model: string;
  valid_until: string;
  implied_volatility: number;
  cap: number;
  latency_ms: number;
}

export async function requestBindingQuote(payload: BindingQuotePayload): Promise<BindingQuoteResponse> {
  const result = await postJSON<{ quote: BindingQuoteResponse }>(
    '/api/quotes/binding',
    payload
  );
  return result.quote;
}

export interface RiskPlanRequest {
  quotes: Array<{ pair: string; spot: number; volatility: number }>;
  exposures: Array<{ pair: string; expiry: string; side: string; delta: number }>;
  hedges: Array<{ pair: string; expiry: string; side: string; delta: number }>;
}

export interface RiskPlanResponse {
  buckets: Array<Record<string, unknown>>;
  execution_plan: Array<Record<string, unknown>>;
  netting_savings: Record<string, unknown>;
}

export async function requestRiskPlan(payload: RiskPlanRequest): Promise<RiskPlanResponse> {
  return postJSON<RiskPlanResponse>('/api/risk/plan', payload);
}
