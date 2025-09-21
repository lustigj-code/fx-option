import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bindingQuoteRequestSchema,
  bindingQuoteResponseSchema,
  executionOrderRequestSchema,
  executionResponseSchema,
  quoteInputSchema,
  riskPlanRequestSchema,
  riskPlanResponseSchema,
} from '../../../../specs/002-wire-portal-and/contracts/gateway';

const iso = (value: string) => new Date(value).toISOString();

test('validates binding quote request payloads', () => {
    const payload = {
      id: 'exp-1',
      currency_pair: 'USD/MXN',
      notional: '1000000',
      strike: '17.55',
      tenor_days: 30,
      market_data: {
        spot: '17.42',
        implied_volatility: '0.18',
        interest_rate: '0.045',
      },
    };

    const parsed = bindingQuoteRequestSchema.parse(payload);
    assert(Math.abs(parsed.notional - 1_000_000) < 1e-6);
    assert(Math.abs(parsed.market_data.implied_volatility - 0.18) < 1e-6);
  });

test('rejects invalid binding quote request', () => {
  assert.throws(() =>
    bindingQuoteRequestSchema.parse({
      id: '',
      currency_pair: 'USD',
      notional: '0',
      strike: '-1',
      tenor_days: 0,
      market_data: {
        spot: 0,
        implied_volatility: -1,
        interest_rate: 'foo',
      },
    }),
  );
});

test('parses binding quote response with downstream event', () => {
    const response = {
      exposure_id: 'exp-1',
      price: '0.1234',
      pricing_model: 'black_scholes',
      valid_until: iso('2024-01-01T00:00:00Z'),
      implied_volatility: '0.18',
      cap: '0.2',
      safety_buffer_seconds: 60,
      latency_ms: 123,
      downstream_event: {
        exposure_id: 'exp-1',
        price: '0.1234',
        valid_until: iso('2024-01-01T00:00:00Z'),
      },
    };

    const parsed = bindingQuoteResponseSchema.parse(response);
    assert(Math.abs(parsed.price - 0.1234) < 1e-6);
    assert(parsed.downstream_event?.valid_until instanceof Date);
  });

test('validates risk plan request and response shapes', () => {
    const request = {
      quotes: [quoteInputSchema.parse({ pair: 'usd/mxn', spot: 17.4, volatility: 0.2 })],
      exposures: [
        {
          pair: 'usd/mxn',
          expiry: '2024-12-31',
          side: 'buy',
          delta: 1_000_000,
          k_distribution: { ATM: 1 },
        },
      ],
      hedges: [],
    };

    const parsedRequest = riskPlanRequestSchema.parse(request);
    assert(Math.abs(parsedRequest.quotes[0].spot - 17.4) < 1e-6);
    assert.strictEqual(parsedRequest.quotes[0].pair, 'USDMXN');
    assert.strictEqual(parsedRequest.exposures[0].side, 'buy');

    const response = {
      buckets: [
        {
          pair: 'USD/MXN',
          week_start: '2024-01-01',
          week_end: '2024-01-05',
          pre_delta: 1,
          post_delta: 0.5,
          pre_var: 2,
          post_var: 1.5,
          distribution: { ATM: 0.5 },
          delta_reduction_pct: 50,
          var_reduction_pct: 25,
          average_tenor_days: 14,
        },
      ],
      execution_plan: [
        { action: 'hedge', quantity: 1_000_000 },
      ],
      netting_savings: {
        delta: 1000,
        var: 2000,
        delta_pct: 12.5,
        var_pct: 10,
      },
    };

    const parsedResponse = riskPlanResponseSchema.parse(response);
    assert.strictEqual(parsedResponse.execution_plan.length, 1);
    assert(parsedResponse.buckets[0].week_start instanceof Date);
  });

test('validates execution order request/response payloads', () => {
    const request = {
      due_date: '2024-02-15',
      quantity: 1_000_000,
      side: 'BUY',
      strike: 17.45,
      right: 'CALL',
      limit_price: 0.0015,
      slippage: 0.0001,
      ladder_layers: 2,
      strike_step: 0.0005,
      expiry_count: 2,
      metadata: { strategy: 'overnight-ladder' },
      dry_run: true,
    };

    const parsedRequest = executionOrderRequestSchema.parse(request);
    assert.strictEqual(parsedRequest.quantity, 1_000_000);

    const response = {
      orders: [
        {
          contract_month: '2024-03-01',
          strike: 17.45,
          right: 'CALL',
          quantity: 1,
          side: 'BUY',
          limit_price: 0.0015,
          status: 'FILLED',
          ib_order_id: 42,
          client_order_id: 'abc',
          account: 'DU123',
          submitted_at: iso('2024-02-01T00:00:00Z'),
          acknowledged_at: iso('2024-02-01T00:01:00Z'),
          fills: [{ price: 0.0015, qty: 1 }],
        },
      ],
      hedge_event: {
        timestamp: iso('2024-02-01T00:01:00Z'),
        side: 'BUY',
        quantity: 1,
        ladder_layers: 2,
      },
    };

    const parsedResponse = executionResponseSchema.parse(response);
    assert(Math.abs(parsedResponse.orders[0].limit_price - 0.0015) < 1e-9);
    assert(parsedResponse.hedge_event?.timestamp instanceof Date);
  });
