declare const jest: {
  fn: <T extends (...args: any[]) => any>(implementation?: T) => jest.MockedFunction<T>;
  mock(moduleName: string, factory?: () => any): void;
  requireMock(moduleName: string): any;
};

declare namespace jest {
  type MockedFunction<T extends (...args: any[]) => any> = ((...args: Parameters<T>) => ReturnType<T>) & {
    mock: { calls: Parameters<T>[] };
  };
}

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void | Promise<void>): void;
declare function expect(actual: any): {
  toContain(expected: string): void;
  not: { toBeNull(): void };
  toHaveBeenCalledWith(...expected: any[]): void;
  toHaveBeenCalledTimes(expected: number): void;
};

declare namespace expect {
  function objectContaining(shape: Record<string, unknown>): any;
}
