declare module 'node:assert/strict' {
  import assert from 'assert';
  export default assert;
  export * from 'assert';
}

declare module 'node:test' {
  export type TestFn = (name: string, fn: () => Promise<void> | void) => void;
  const test: TestFn;
  export default test;
  export { test };
}
