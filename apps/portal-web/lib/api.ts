import {
  createGatewayClient,
  gatewayClient,
  type BindingQuoteRequest,
  type BindingQuoteResponse,
  type GatewayClient,
  type RiskPlanRequest,
  type RiskPlanResponse,
} from '@shared/api/client';
import * as sharedConfig from '@shared/api/config';

export type BindingQuotePayload = BindingQuoteRequest;

export type {
  BindingQuoteResponse,
  RiskPlanRequest,
  RiskPlanResponse,
  GatewayClient,
};

export { createGatewayClient, gatewayClient };
export { type GatewayConfig } from '@shared/api/config';

export const getGatewayConfig = () => sharedConfig.readGatewayConfig();
export const isGatewayEnabled = () => sharedConfig.isGatewayEnabled();

export function requestBindingQuote(payload: BindingQuotePayload, init?: RequestInit) {
  return gatewayClient.requestBindingQuote(payload, init);
}

export function requestRiskPlan(payload: RiskPlanRequest, init?: RequestInit) {
  return gatewayClient.fetchRiskPlan(payload, init);
}
