import assert from 'node:assert/strict';

import { fetchRiskPlan, getGatewayConfig, isGatewayEnabled } from '@/lib/api';
import { gatewayClient, type RiskPlanRequest, type RiskPlanResponse } from '@shared/api/client';
import * as sharedConfig from '@shared/api/config';

describe('admin api wrapper', () => {
  const payload: RiskPlanRequest = {
    quotes: [],
    exposures: [],
    hedges: [],
  };

  test('fetchRiskPlan delegates to the shared client with passthrough payloads', async () => {
    const original = gatewayClient.fetchRiskPlan;
    const calls: Array<[RiskPlanRequest, RequestInit | undefined]> = [];
    const response: RiskPlanResponse = {
      buckets: [],
      execution_plan: [],
      netting_savings: {
        delta: 0,
        var: 0,
        delta_pct: 0,
        var_pct: 0,
      },
    };

    gatewayClient.fetchRiskPlan = (async (incoming: RiskPlanRequest, init?: RequestInit) => {
      calls.push([incoming, init]);
      return response;
    }) as typeof gatewayClient.fetchRiskPlan;

    try {
      const result = await fetchRiskPlan(payload);
      assert.equal(result, response);
      assert.equal(calls.length, 1);
      assert.strictEqual(calls[0][0], payload);
      assert.equal(calls[0][1], undefined);
    } finally {
      gatewayClient.fetchRiskPlan = original;
    }
  });

  test('fetchRiskPlan converts non-error rejections into standard errors', async () => {
    const original = gatewayClient.fetchRiskPlan;

    gatewayClient.fetchRiskPlan = (async () => {
      throw 'boom';
    }) as typeof gatewayClient.fetchRiskPlan;

    try {
      await assert.rejects(fetchRiskPlan(payload), (error: unknown) => {
        return error instanceof Error && error.message === 'Failed to fetch risk plan';
      });
    } finally {
      gatewayClient.fetchRiskPlan = original;
    }
  });

  test('fetchRiskPlan rethrows existing Error instances', async () => {
    const original = gatewayClient.fetchRiskPlan;
    const failure = new Error('network down');

    gatewayClient.fetchRiskPlan = (async () => {
      throw failure;
    }) as typeof gatewayClient.fetchRiskPlan;

    try {
      await assert.rejects(fetchRiskPlan(payload), (error: unknown) => error === failure);
    } finally {
      gatewayClient.fetchRiskPlan = original;
    }
  });

  test('exposes gateway config helpers for feature toggling', () => {
    const originalValues: Record<string, string | undefined> = {
      NEXT_PUBLIC_GATEWAY_ENABLED: process.env.NEXT_PUBLIC_GATEWAY_ENABLED,
      NEXT_PUBLIC_GATEWAY_BASE_URL: process.env.NEXT_PUBLIC_GATEWAY_BASE_URL,
      NEXT_PUBLIC_GATEWAY_POLL_INTERVAL_MS: process.env.NEXT_PUBLIC_GATEWAY_POLL_INTERVAL_MS,
      NEXT_PUBLIC_GATEWAY_MAX_BACKOFF_MS: process.env.NEXT_PUBLIC_GATEWAY_MAX_BACKOFF_MS,
      NEXT_PUBLIC_GATEWAY_RETRY_LIMIT: process.env.NEXT_PUBLIC_GATEWAY_RETRY_LIMIT,
    };

    try {
      process.env.NEXT_PUBLIC_GATEWAY_ENABLED = 'false';
      process.env.NEXT_PUBLIC_GATEWAY_BASE_URL = 'https://admin-gateway.fx';
      process.env.NEXT_PUBLIC_GATEWAY_POLL_INTERVAL_MS = '5000';
      process.env.NEXT_PUBLIC_GATEWAY_MAX_BACKOFF_MS = '20000';
      process.env.NEXT_PUBLIC_GATEWAY_RETRY_LIMIT = '2';

      const config = getGatewayConfig();
      assert.equal(config.enabled, false);
      assert.equal(config.baseUrl, 'https://admin-gateway.fx');
      assert.equal(config.pollIntervalMs, 5000);
      assert.equal(config.maxBackoffMs, 20000);
      assert.equal(config.retryLimit, 2);
      assert.equal(isGatewayEnabled(), false);
    } finally {
      Object.entries(originalValues).forEach(([key, value]) => {
        if (typeof value === 'undefined') {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      });
    }
  });
});
