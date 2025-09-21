import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { getGatewayConfig, isGatewayEnabled, requestBindingQuote, requestRiskPlan } from '@/lib/api';
import { gatewayClient, type BindingQuoteRequest, type RiskPlanRequest } from '@shared/api/client';
import * as sharedConfig from '@shared/api/config';

describe('portal api wrappers', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('delegates binding quote requests to the shared gateway client', async () => {
    const payload = {
      id: 'exp-123',
      currency_pair: 'EURUSD',
      notional: 1_000_000,
      strike: 1.12,
      tenor_days: 7,
      market_data: {
        spot: 1.11,
        implied_volatility: 0.2,
        interest_rate: 0.05,
      },
    };

    const response = {
      exposure_id: 'exp-123',
      price: 12.34,
      pricing_model: 'bs',
      valid_until: new Date().toISOString(),
      implied_volatility: 0.2,
      cap: 100,
      safety_buffer_seconds: 5,
      latency_ms: 20,
      downstream_event: null,
    };

    mock.method(gatewayClient, 'requestBindingQuote', async (incoming: BindingQuoteRequest) => {
      assert.deepEqual(incoming, payload);
      return response;
    });

    const result = await requestBindingQuote(payload);
    assert.equal(result, response);
  });

  it('delegates risk plan requests to the shared gateway client', async () => {
    const payload = {
      quotes: [],
      exposures: [],
      hedges: [],
    };

    const response = {
      buckets: [],
      execution_plan: [],
      netting_savings: {
        delta: 0,
        var: 0,
        delta_pct: 0,
        var_pct: 0,
      },
    };

    mock.method(gatewayClient, 'fetchRiskPlan', async (incoming: RiskPlanRequest) => {
      assert.equal(incoming, payload);
      return response;
    });

    const result = await requestRiskPlan(payload);
    assert.equal(result, response);
  });

  it('re-exports gateway configuration helpers from the shared module', () => {
    const config = {
      enabled: true,
      baseUrl: 'https://gateway.fx',
      pollIntervalMs: 12_000,
      maxBackoffMs: 45_000,
      retryLimit: 4,
    };

    mock.method(sharedConfig, 'readGatewayConfig', () => config);
    mock.method(sharedConfig, 'isGatewayEnabled', () => true);

    assert.equal(getGatewayConfig(), config);
    assert.equal(isGatewayEnabled(), true);
  });
});
