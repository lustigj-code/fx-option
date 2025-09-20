const API_BASE_URL = process.env.ADMIN_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

async function postJSON<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    ...init,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await response.text() || response.statusText);
  }

  return response.json() as Promise<T>;
}

export interface RiskPlan {
  buckets: Array<Record<string, unknown>>;
  execution_plan: Array<Record<string, unknown>>;
  netting_savings: Record<string, unknown>;
}

export async function fetchRiskPlan(payload: unknown): Promise<RiskPlan> {
  return postJSON<RiskPlan>('/api/risk/plan', payload);
}

export { postJSON };
