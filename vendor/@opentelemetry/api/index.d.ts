export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
}

export interface SpanStatus {
  code: SpanStatusCode;
  message?: string;
}

export type SpanAttributes = Record<string, unknown>;

export type Exception = unknown;

export interface Span {
  spanContext(): SpanContext;
  setAttribute(key: string, value: unknown): this;
  setAttributes(attributes: SpanAttributes): this;
  addEvent(name: string, attributes?: SpanAttributes): this;
  addEvent(name: string, time: number, attributes?: SpanAttributes): this;
  setStatus(status: SpanStatus): this;
  updateName(name: string): this;
  end(): void;
  isRecording(): boolean;
  recordException(exception: Exception): this;
}

export interface SpanOptions {
  attributes?: SpanAttributes;
}

export interface Tracer {
  startSpan(name: string, options?: SpanOptions): Span;
}

export declare const trace: {
  getTracer(name: string): Tracer;
};

export declare const SpanStatusCode: {
  readonly UNSET: 0;
  readonly OK: 1;
  readonly ERROR: 2;
};
