declare module 'next/dist/compiled/zod' {
  type Optional<T> = T | undefined;
  type Nullable<T> = T | null;

  interface BaseSchema<T> {
    _type: T;
    parse(input: unknown): T;
    optional(): BaseSchema<Optional<T>>;
    nullable(): BaseSchema<Nullable<T>>;
    default(value: T): BaseSchema<T>;
  }

  interface NumberSchema extends BaseSchema<number> {
    gt(value: number, message?: string): NumberSchema;
    min(value: number, message?: string): NumberSchema;
    int(): NumberSchema;
  }

  interface DateSchema extends BaseSchema<Date> {}

  interface BooleanSchema extends BaseSchema<boolean> {}

  interface StringSchema<T extends string = string> extends BaseSchema<T> {
    min(value: number, message?: string): StringSchema<T>;
    transform<U>(fn: (value: T) => U): BaseSchema<U>;
  }

  interface ArraySchema<T> extends BaseSchema<T[]> {}

  interface RecordSchema<V> extends BaseSchema<Record<string, V>> {}

  type Infer<T> = T extends { _type: infer O } ? O : never;

  type Shape = Record<string, BaseSchema<any>>;

  interface ObjectSchema<S extends Shape> extends BaseSchema<{ [K in keyof S]: Infer<S[K]> }> {}

  interface CoerceFactory {
    number(): NumberSchema;
    date(): DateSchema;
  }

  interface ZodExports {
    coerce: CoerceFactory;
    string(): StringSchema;
    boolean(): BooleanSchema;
    object<S extends Shape>(shape: S): ObjectSchema<S>;
    array<T>(schema: BaseSchema<T>): ArraySchema<Infer<typeof schema>>;
    record<T>(schema: BaseSchema<T>): RecordSchema<Infer<typeof schema>>;
    record<K, V>(keySchema: BaseSchema<K>, valueSchema: BaseSchema<V>): RecordSchema<Infer<typeof valueSchema>>;
    unknown(): BaseSchema<unknown>;
  }

  export const z: ZodExports;
  export type infer<T extends BaseSchema<any>> = Infer<T>;
  export namespace z {
    export type infer<T extends BaseSchema<any>> = Infer<T>;
  }
}
