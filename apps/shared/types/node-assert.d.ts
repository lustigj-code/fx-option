declare module 'node:assert/strict' {
  import assert from 'assert';
  export default assert;
  export * from 'assert';
}

declare module 'node:test' {
  export type TestCallback = () => Promise<void> | void;
  export type TestFn = (name: string, fn: TestCallback) => void;

  export interface MockCall<Args extends unknown[]> {
    arguments: Args;
  }

  export interface MockTracker<Args extends unknown[]> {
    calls: Array<MockCall<Args>>;
    callCount(): number;
  }

  export interface MockFunction<Args extends unknown[], Return> {
    (...args: Args): Return;
    mock: MockTracker<Args>;
  }

  export const mock: {
    fn<T extends (...args: any[]) => any>(implementation?: T): MockFunction<Parameters<T>, Awaited<ReturnType<T>>>;
    method<T extends object, K extends keyof T>(
      object: T,
      method: K,
      implementation: T[K]
    ): { restore(): void };
    restoreAll(): void;
  };

  export const test: TestFn;
  export function describe(name: string, fn: TestCallback): void;
  export function it(name: string, fn: TestCallback): void;
  export function beforeEach(fn: TestCallback): void;
  export function afterEach(fn: TestCallback): void;

  export default test;
}
