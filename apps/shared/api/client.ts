import {
  bindingQuoteRequestSchema,
  bindingQuoteResponseSchema,
  executionOrderRequestSchema,
  executionResponseSchema,
  riskPlanRequestSchema,
  riskPlanResponseSchema,
  type BindingQuoteRequest,
  type BindingQuoteResponse,
  type ExecutionOrderRequest,
  type ExecutionResponse,
  type RiskPlanRequest,
  type RiskPlanResponse,
} from '../../../specs/002-wire-portal-and/contracts/gateway';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { readGatewayConfig } from './config';

const globalFetch: typeof fetch | undefined = typeof fetch !== 'undefined' ? fetch.bind(globalThis) : undefined;
const now = typeof performance !== 'undefined' && performance && typeof performance.now === 'function'
  ? () => performance.now()
  : () => Date.now();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type GatewayTelemetryStatus = 'success' | 'error';

export type GatewayEndpoint = 'bindingQuote' | 'riskPlan' | 'execution';

export interface GatewayTelemetryEvent {
  endpoint: GatewayEndpoint;
  status: GatewayTelemetryStatus;
  latencyMs: number;
  errorCode?: string;
  userId?: string;
  timestamp: string;
}

type GatewayTelemetryInput = Omit<GatewayTelemetryEvent, 'timestamp' | 'userId'> & { userId?: string };

export type TelemetryEmitter = (event: GatewayTelemetryEvent) => void | Promise<void>;

export interface GatewayClientConfig {
  baseUrl?: string;
  pollIntervalMs?: number;
  maxBackoffMs?: number;
  retryLimit?: number;
  emitTelemetry?: TelemetryEmitter;
  getUserId?: () => string | undefined;
  fetchImplementation?: typeof fetch;
}

export interface GatewayClient {
  requestBindingQuote: (payload: BindingQuoteRequest, init?: RequestInit) => Promise<BindingQuoteResponse>;
  fetchRiskPlan: (payload: RiskPlanRequest, init?: RequestInit) => Promise<RiskPlanResponse>;
  submitExecutionOrder: (
    payload: ExecutionOrderRequest,
    init?: RequestInit
  ) => Promise<ExecutionResponse>;
}

class GatewayError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

export const createGatewayClient = (config: GatewayClientConfig = {}): GatewayClient => {
  const envConfig = readGatewayConfig();
  const resolvedConfig = {
    baseUrl: config.baseUrl ?? envConfig.baseUrl,
    pollIntervalMs: config.pollIntervalMs ?? envConfig.pollIntervalMs,
    maxBackoffMs: config.maxBackoffMs ?? envConfig.maxBackoffMs,
    retryLimit: config.retryLimit ?? envConfig.retryLimit,
    emitTelemetry: config.emitTelemetry,
    getUserId: config.getUserId,
    fetchImplementation: config.fetchImplementation ?? globalFetch,
  };

  if (!resolvedConfig.fetchImplementation) {
    throw new Error('No fetch implementation available for gateway client.');
  }

  const fetchImpl = resolvedConfig.fetchImplementation;
  const tracer = trace.getTracer('fx-option.gateway');

  const requestJson = async <Output>(
    endpoint: GatewayEndpoint,
    schema: { parse: (input: unknown) => Output },
    body: unknown,
    init?: RequestInit
  ): Promise<Output> => {
    const url = new URL(endpointPath(endpoint), resolvedConfig.baseUrl).toString();
    let attempt = 0;
    let lastError: unknown;

    while (attempt < resolvedConfig.retryLimit) {
      const span = tracer.startSpan(`gateway.${endpoint}`, {
        attributes: {
          'gateway.endpoint': endpoint,
          'gateway.base_url': resolvedConfig.baseUrl,
          'gateway.attempt': attempt + 1,
        },
      });
      const startedAt = now();
      let statusSet = false;
      let exceptionRecorded = false;
      try {
        const response = await fetchImpl(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
          },
          body: JSON.stringify(body),
          ...init,
        });

        const latency = now() - startedAt;
        span.setAttribute('gateway.latency_ms', latency);
        span.setAttribute('http.status_code', response.status);

        if (!response.ok) {
          const text = await safeReadText(response);
          const error = new GatewayError(
            `Gateway request failed with status ${response.status}`,
            response.status,
            text
          );
          span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
          statusSet = true;
          if (span.isRecording()) {
            span.recordException(error);
            exceptionRecorded = true;
          }
          if (shouldRetry(response.status) && attempt + 1 < resolvedConfig.retryLimit) {
            await emitTelemetry({ endpoint, status: 'error', latencyMs: latency, errorCode: `${response.status}` });
            const wait = await delay(attempt + 1, resolvedConfig);
            span.setAttribute('gateway.retry_delay_ms', wait);
            span.addEvent('gateway.retry', {
              'gateway.retry_delay_ms': wait,
              'gateway.attempt': attempt + 1,
              'http.status_code': response.status,
            });
            attempt += 1;
            lastError = error;
            continue;
          }

          await emitTelemetry({ endpoint, status: 'error', latencyMs: latency, errorCode: `${response.status}` });
          lastError = error;
          throw error;
        }

        const parsedJson = await response.json();
        const data = schema.parse(parsedJson);
        await emitTelemetry({ endpoint, status: 'success', latencyMs: latency });
        span.setStatus({ code: SpanStatusCode.OK });
        statusSet = true;
        return data;
      } catch (error) {
        lastError = error;
        const normalizedError = error instanceof Error ? error : new Error('Gateway request failed');
        if (!statusSet) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: normalizedError.message });
          statusSet = true;
        }
        if (!exceptionRecorded && span.isRecording()) {
          span.recordException(normalizedError);
          exceptionRecorded = true;
        }
        if (attempt + 1 >= resolvedConfig.retryLimit) {
          await emitTelemetry({ endpoint, status: 'error', latencyMs: now() - startedAt, errorCode: 'network_error' });
          throw normalizedError;
        }
        const wait = await delay(attempt + 1, resolvedConfig);
        span.setAttribute('gateway.retry_delay_ms', wait);
        span.addEvent('gateway.retry', {
          'gateway.retry_delay_ms': wait,
          'gateway.attempt': attempt + 1,
        });
        attempt += 1;
      }
      finally {
        span.setAttribute('gateway.retry_count', attempt);
        span.end();
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Gateway request failed');
  };

  const emitTelemetry = async (event: GatewayTelemetryInput) => {
    if (!resolvedConfig.emitTelemetry) return;
    try {
      await resolvedConfig.emitTelemetry({
        ...event,
        userId: resolvedConfig.getUserId?.() ?? event.userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to emit gateway telemetry', error);
      }
    }
  };

  const delay = async (
    attemptNumber: number,
    { pollIntervalMs, maxBackoffMs }: { pollIntervalMs: number; maxBackoffMs: number }
  ): Promise<number> => {
    const wait = Math.min(maxBackoffMs, pollIntervalMs * 2 ** (attemptNumber - 1));
    await sleep(wait);
    return wait;
  };

  const safeReadText = async (response: Response) => {
    try {
      return await response.text();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to read gateway error response', error);
      }
      return null;
    }
  };

  return {
    requestBindingQuote: async (payload, init) => {
      const request = bindingQuoteRequestSchema.parse(payload);
      return requestJson('bindingQuote', bindingQuoteResponseSchema, request, init);
    },
    fetchRiskPlan: async (payload, init) => {
      const request = riskPlanRequestSchema.parse(payload);
      return requestJson('riskPlan', riskPlanResponseSchema, request, init);
    },
    submitExecutionOrder: async (payload, init) => {
      const request = executionOrderRequestSchema.parse(payload);
      const serialized = {
        ...request,
        due_date: request.due_date.toISOString().slice(0, 10),
      };
      return requestJson('execution', executionResponseSchema, serialized, init);
    },
  };
};

const endpointPath = (endpoint: GatewayEndpoint): string => {
  switch (endpoint) {
    case 'bindingQuote':
      return '/api/quotes/binding';
    case 'riskPlan':
      return '/api/risk/plan';
    case 'execution':
      return '/api/execution/orders';
    default:
      return endpoint satisfies never;
  }
};

const shouldRetry = (status: number) => status >= 500 || status === 429;

export const gatewayClient = createGatewayClient();

export type {
  BindingQuoteRequest,
  BindingQuoteResponse,
  RiskPlanRequest,
  RiskPlanResponse,
  ExecutionOrderRequest,
  ExecutionResponse,
};
