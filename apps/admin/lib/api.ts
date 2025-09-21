import {
  createGatewayClient,
  gatewayClient as sharedGatewayClient,
  type GatewayClient,
  type RiskPlanRequest,
  type RiskPlanResponse,
} from '@shared/api/client';
import * as sharedConfig from '@shared/api/config';

let cachedGatewayClient: GatewayClient | null = null;

function resolveGatewayClient(): GatewayClient {
  if (cachedGatewayClient) {
    return cachedGatewayClient;
  }

  const adminBaseUrl = process.env.ADMIN_API_BASE_URL;
  if (adminBaseUrl && adminBaseUrl.length > 0) {
    cachedGatewayClient = createGatewayClient({ baseUrl: adminBaseUrl });
    return cachedGatewayClient;
  }

  cachedGatewayClient = sharedGatewayClient;
  return cachedGatewayClient;
}

export type { RiskPlanRequest, RiskPlanResponse, GatewayClient };
export { type GatewayConfig } from '@shared/api/config';
export const getGatewayConfig = () => sharedConfig.readGatewayConfig();
export const isGatewayEnabled = () => sharedConfig.isGatewayEnabled();

export async function fetchRiskPlan(payload: RiskPlanRequest, init?: RequestInit): Promise<RiskPlanResponse> {
  try {
    return await resolveGatewayClient().fetchRiskPlan(payload, init);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch risk plan');
  }
}
