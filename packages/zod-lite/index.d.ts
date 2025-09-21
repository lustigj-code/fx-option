export class ZodError extends Error {
  constructor(issues: Array<{ message: string; received?: unknown }>)
  issues: Array<{ message: string; received?: unknown }>
}

export type SafeParseSuccess<T> = { success: true; data: T }
export type SafeParseFailure = { success: false; error: ZodError }

export interface ZodType<T> {
  parse(input: unknown): T
  safeParse(input: unknown): SafeParseSuccess<T> | SafeParseFailure
  refine(check: (value: T) => boolean, message?: string): this
  optional(): ZodType<T | undefined>
  nullable(): ZodType<T | null>
  default(value: T | (() => T)): ZodType<T>
}

export interface ZodString extends ZodType<string> {
  min(length: number, message?: string): this
  max(length: number, message?: string): this
  email(message?: string): this
  regex(pattern: RegExp, message?: string): this
  trim(): ZodString
}

export interface ZodNumber extends ZodType<number> {
  min(value: number, message?: string): this
  max(value: number, message?: string): this
  int(message?: string): this
  positive(message?: string): this
  nonnegative(message?: string): this
}

export interface ZodBoolean extends ZodType<boolean> {}

export interface ZodLiteral<T> extends ZodType<T> {}

export interface ZodEnum<T extends readonly [string, ...string[]]> extends ZodType<T[number]> {}

export interface ZodArray<T extends ZodType<any>> extends ZodType<Array<inferType<T>>> {
  min(length: number, message?: string): this
}

export type ZodObjectShape = Record<string, ZodType<any>>
export type ObjectOutput<T extends ZodObjectShape> = { [K in keyof T]: inferType<T[K]> }

export interface ZodObject<T extends ZodObjectShape> extends ZodType<ObjectOutput<T>> {
  strict(): ZodObject<T>
  extend<U extends ZodObjectShape>(extension: U): ZodObject<T & U>
  partial(): ZodObject<{ [K in keyof T]: ZodType<any> }>
}

export interface ZodUnion<T extends readonly ZodType<any>[]> extends ZodType<inferType<T[number]>> {}

export type inferType<T extends ZodType<any>> = T extends ZodType<infer Output> ? Output : never

export const z: {
  ZodError: typeof ZodError
  string(): ZodString
  number(): ZodNumber
  boolean(): ZodBoolean
  literal<T extends string | number | boolean>(value: T): ZodLiteral<T>
  enum<T extends readonly [string, ...string[]]>(values: T): ZodEnum<T>
  object<T extends ZodObjectShape>(shape: T): ZodObject<T>
  array<T extends ZodType<any>>(schema: T): ZodArray<T>
  union<T extends readonly [ZodType<any>, ...ZodType<any>[]]>(schemas: T): ZodUnion<T>
}

export type infer<T extends ZodType<any>> = inferType<T>
