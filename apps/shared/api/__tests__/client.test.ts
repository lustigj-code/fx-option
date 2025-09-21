import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type {
  Exception,
  Span,
  SpanAttributes,
  SpanContext,
  SpanOptions,
  SpanStatus,
  Tracer,
} from '@opentelemetry/api';
import { SpanStatusCode, trace } from '@opentelemetry/api';

import {
  createGatewayClient,
  type GatewayTelemetryEvent,
  type GatewayTelemetryStatus,
} from '../client';

type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

describe('createGatewayClient', () => {
  let events: Mutable<GatewayTelemetryEvent>[];
  let warnings: Array<[unknown, unknown?]>;
  let spans: TestSpan[];
  let tracer: Tracer;

  beforeEach(() => {
    events = [];
    warnings = [];
    spans = [];
    mock.method(console, 'warn', (message: unknown, error?: unknown) => {
      warnings.push([message, error]);
    });
    tracer = {
      startSpan: mock.fn((name: string, options?: SpanOptions) => {
        const span = new TestSpan(name, options?.attributes ?? {});
        spans.push(span);
        return span;
      }),
    } as unknown as Tracer;
    mock.method(trace, 'getTracer', () => tracer);
  });

  afterEach(() => {
    mock.restoreAll();
  });

  const buildResponse = (body: unknown, init: { status: number }) => ({
    ok: init.status >= 200 && init.status < 300,
    status: init.status,
    async json() {
      return body;
    },
    async text() {
      return JSON.stringify(body);
    },
  });

  const createClient = (fetchImpl: typeof fetch, overrides: Record<string, unknown> = {}) =>
    createGatewayClient({
      baseUrl: 'https://gateway.local',
      fetchImplementation: fetchImpl,
      pollIntervalMs: 1,
      maxBackoffMs: 2,
      retryLimit: 3,
      emitTelemetry: async (event) => {
        events.push(event as Mutable<GatewayTelemetryEvent>);
      },
      getUserId: () => 'user-123',
      ...overrides,
    });

  const makeQuoteRequest = () => ({
    id: 'quote-1',
    currency_pair: 'EURUSD',
    notional: 1_000_000,
    strike: 1.12,
    tenor_days: 7,
    market_data: { spot: 1.11, implied_volatility: 0.2, interest_rate: 0.05 },
  });

  it('sends binding quote requests and emits telemetry for success', async () => {
    const fetchMock = mock.fn(async () =>
      buildResponse(
        {
          exposure_id: 'exp-1',
          price: 12.34,
          pricing_model: 'bs',
          valid_until: new Date().toISOString(),
          implied_volatility: 0.21,
          cap: 100,
          safety_buffer_seconds: 5,
          latency_ms: 12,
          downstream_event: null,
        },
        { status: 200 }
      )
    );

    const client = createClient(fetchMock as unknown as typeof fetch);

    const response = await client.requestBindingQuote(makeQuoteRequest());

    assert.equal(fetchMock.mock.callCount(), 1);
    const call = fetchMock.mock.calls[0];
    assert.ok(call);
    const args = call.arguments as unknown[];
    assert.ok(args[0]);
    const url = args[0] as string;
    const init = args[1] as RequestInit | undefined;
    assert.equal(url, 'https://gateway.local/api/quotes/binding');
    assert.equal(init?.method, 'POST');
    const headers = init?.headers as Record<string, string> | undefined;
    assert.equal(headers?.['Content-Type'], 'application/json');

    assert.equal(response.exposure_id, 'exp-1');
    assert.equal(events.length, 1);
    assertTelemetry(events[0], 'success');
    assert.equal(events[0].endpoint, 'bindingQuote');
    assert.equal(events[0].userId, 'user-123');
    assert.ok(Number.isFinite(events[0].latencyMs));
    assert.equal(typeof events[0].timestamp, 'string');
    assert.equal(spans.length, 1);
    assert.equal(spans[0].name, 'gateway.bindingQuote');
    assertSpanAttribute(spans[0], 'gateway.endpoint', 'bindingQuote');
    assertSpanAttribute(spans[0], 'gateway.base_url', 'https://gateway.local');
    assertSpanAttribute(spans[0], 'gateway.attempt', 1);
    assert.equal(typeof spans[0].attributes.get('gateway.latency_ms'), 'number');
    assert.equal(spans[0].status.code, SpanStatusCode.OK);
    assert.equal(spans[0].ended, true);
  });

  it('retries on retryable errors and records telemetry for each attempt', async () => {
    const fetchMock = mock.fn(async () => {
      const callIndex = fetchMock.mock.callCount();
      if (callIndex === 0) {
        return buildResponse({ error: 'boom' }, { status: 500 });
      }

      return buildResponse(
        {
          exposure_id: 'exp-1',
          price: 12.34,
          pricing_model: 'bs',
          valid_until: new Date().toISOString(),
          implied_volatility: 0.21,
          cap: 100,
          safety_buffer_seconds: 5,
          latency_ms: 12,
          downstream_event: null,
        },
        { status: 200 }
      );
    });

    const client = createClient(fetchMock as unknown as typeof fetch);

    const response = await client.requestBindingQuote(makeQuoteRequest());

    assert.equal(fetchMock.mock.callCount(), 2);
    assert.equal(response.exposure_id, 'exp-1');
    assert.equal(events.length, 2);
    assertTelemetry(events[0], 'error');
    assert.equal(events[0].errorCode, '500');
    assertTelemetry(events[1], 'success');
    assert.equal(spans.length, 2);
    assert.equal(spans[0].status.code, SpanStatusCode.ERROR);
    assertSpanAttribute(spans[0], 'http.status_code', 500);
    assertSpanAttribute(spans[0], 'gateway.retry_delay_ms', 1);
    assert.equal(spans[1].status.code, SpanStatusCode.OK);
    assertSpanAttribute(spans[1], 'gateway.retry_count', 1);
  });

  it('serializes execution order dates before sending to the gateway', async () => {
    let serializedBody: Record<string, unknown> | undefined;
    const fetchMock = mock.fn(async (_url: string, init?: RequestInit) => {
      serializedBody = JSON.parse(init?.body as string);
      return buildResponse({ orders: [], hedge_event: null }, { status: 200 });
    });

    const client = createClient(fetchMock as unknown as typeof fetch);

    const dueDate = new Date('2025-05-01T00:00:00Z');

    await client.submitExecutionOrder({
      due_date: dueDate,
      quantity: 10,
      side: 'BUY',
      strike: 1.23,
      right: 'CALL',
      limit_price: 1.25,
      slippage: 0,
      ladder_layers: 1,
      strike_step: 0.0025,
      expiry_count: 2,
      account: null,
      client_order_id: null,
      metadata: {},
      dry_run: true,
    });

    assert.ok(serializedBody);
    assert.equal(serializedBody?.due_date, '2025-05-01');
  });

  it('emits telemetry for network failures and surfaces the error', async () => {
    const fetchMock = mock.fn(async () => {
      throw new Error('network down');
    });

    const client = createClient(fetchMock as unknown as typeof fetch);

    await assert.rejects(
      async () => client.requestBindingQuote(makeQuoteRequest()),
      /network down/
    );

    assert.equal(events.length, 1);
    assertTelemetry(events[0], 'error');
    assert.equal(events[0].errorCode, 'network_error');
    assert.equal(spans.length, 3);
    assert.equal(spans[0].status.code, SpanStatusCode.ERROR);
    assertSpanAttribute(spans[0], 'gateway.retry_delay_ms', 1);
    assert.equal(spans[1].status.code, SpanStatusCode.ERROR);
    assertSpanAttribute(spans[1], 'gateway.retry_delay_ms', 2);
    assert.equal(spans[2].status.code, SpanStatusCode.ERROR);
    assert.equal(spans[2].recorded.length, 1);
  });

  it('swallows telemetry emitter failures in non-production', async () => {
    const fetchMock = mock.fn(async () =>
      buildResponse(
        {
          exposure_id: 'exp-1',
          price: 12.34,
          pricing_model: 'bs',
          valid_until: new Date().toISOString(),
          implied_volatility: 0.21,
          cap: 100,
          safety_buffer_seconds: 5,
          latency_ms: 12,
          downstream_event: null,
        },
        { status: 200 }
      )
    );

    const client = createGatewayClient({
      baseUrl: 'https://gateway.local',
      fetchImplementation: fetchMock as unknown as typeof fetch,
      pollIntervalMs: 1,
      maxBackoffMs: 2,
      retryLimit: 1,
      emitTelemetry: () => {
        throw new Error('telemetry down');
      },
    });

    await client.requestBindingQuote(makeQuoteRequest());

    assert.equal(fetchMock.mock.callCount(), 1);
    assert.equal(warnings.length, 1);
    assert.match(String(warnings[0][0]), /Failed to emit gateway telemetry/);
  });
});

function assertTelemetry(event: GatewayTelemetryEvent, status: GatewayTelemetryStatus) {
  assert.equal(event.status, status);
  assert.equal(event.endpoint === 'bindingQuote' || event.endpoint === 'riskPlan' || event.endpoint === 'execution', true);
  assert.equal(typeof event.latencyMs, 'number');
}

function assertSpanAttribute(span: TestSpan, key: string, value: unknown) {
  assert.equal(span.attributes.get(key), value);
}

class TestSpan implements Span {
  public readonly attributes = new Map<string, unknown>();
  public readonly events: Array<{ name: string; attributes?: Record<string, unknown> }> = [];
  public readonly recorded: unknown[] = [];
  public status: SpanStatus = { code: SpanStatusCode.UNSET };
  public ended = false;

  constructor(public name: string, attributes: SpanAttributes) {
    this.setAttributes(attributes);
  }

  spanContext(): SpanContext {
    return { traceId: 'trace-id', spanId: 'span-id', traceFlags: 1 };
  }

  setAttribute(key: string, value: unknown): this {
    this.attributes.set(key, value);
    return this;
  }

  setAttributes(attributes: SpanAttributes): this {
    for (const [key, value] of Object.entries(attributes)) {
      this.attributes.set(key, value);
    }
    return this;
  }

  addEvent(name: string, attributesOrTime?: SpanAttributes | number | Date, maybeAttributes?: SpanAttributes): this {
    let attributes: SpanAttributes | undefined;
    if (attributesOrTime && typeof attributesOrTime === 'object' && !(attributesOrTime instanceof Date)) {
      attributes = attributesOrTime as SpanAttributes;
    } else if (maybeAttributes) {
      attributes = maybeAttributes;
    }
    this.events.push({ name, attributes: attributes ? { ...attributes } : undefined });
    return this;
  }

  setStatus(status: SpanStatus): this {
    this.status = status;
    return this;
  }

  updateName(name: string): this {
    this.name = name;
    return this;
  }

  end(): void {
    this.ended = true;
  }

  isRecording(): boolean {
    return true;
  }

  recordException(exception: Exception): this {
    this.recorded.push(exception);
    return this;
  }
}
