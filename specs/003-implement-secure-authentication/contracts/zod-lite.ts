export type SafeParseSuccess<T> = { success: true; data: T };
export type SafeParseError = { success: false; error: Error };

class Schema<T> {
  constructor(private readonly validator: (value: unknown) => T) {}

  parse(value: unknown): T {
    return this.validator(value);
  }

  safeParse(value: unknown): SafeParseSuccess<T> | SafeParseError {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  optional(): Schema<T | undefined> {
    return new Schema<T | undefined>((value) => {
      if (value === undefined || value === null) {
        return undefined;
      }
      return this.parse(value);
    });
  }

  default(defaultValue: T): Schema<T> {
    return new Schema<T>((value) => (value === undefined ? defaultValue : this.parse(value)));
  }

  transform<U>(transformer: (value: T) => U): Schema<U> {
    return new Schema<U>((value) => transformer(this.parse(value)));
  }

  refine(predicate: (value: T) => boolean, options?: { message?: string }): Schema<T> {
    return new Schema<T>((value) => {
      const parsed = this.parse(value);
      if (!predicate(parsed)) {
        throw new Error(options?.message ?? 'Invalid value');
      }
      return parsed;
    });
  }
}

class StringSchema extends Schema<string> {
  min(length: number, message?: string): StringSchema {
    return new StringSchema((value) => {
      const parsed = super.parse(value);
      if (parsed.length < length) {
        throw new Error(message ?? `Must contain at least ${length} characters`);
      }
      return parsed;
    });
  }

  max(length: number, message?: string): StringSchema {
    return new StringSchema((value) => {
      const parsed = super.parse(value);
      if (parsed.length > length) {
        throw new Error(message ?? `Must contain at most ${length} characters`);
      }
      return parsed;
    });
  }

  email(message = 'Invalid email'): StringSchema {
    return this.refine((value) => /.+@.+\..+/.test(value), { message });
  }

  uuid(message = 'Invalid UUID'): StringSchema {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return this.refine((value) => uuidPattern.test(value), { message });
  }

  url(message = 'Invalid URL'): StringSchema {
    return this.refine((value) => {
      try {
        // eslint-disable-next-line no-new
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, { message });
  }

  datetime(message = 'Invalid datetime'): StringSchema {
    return this.refine((value) => !Number.isNaN(Date.parse(value)), { message });
  }
}

class NumberSchema extends Schema<number> {
  int(): NumberSchema {
    return new NumberSchema((value) => {
      const parsed = super.parse(value);
      if (!Number.isInteger(parsed)) {
        throw new Error('Expected integer');
      }
      return parsed;
    });
  }

  positive(message = 'Value must be positive'): NumberSchema {
    return this.refine((value) => value > 0, { message });
  }
}

class BooleanSchema extends Schema<boolean> {}

class ArraySchema<T> extends Schema<T[]> {
  constructor(private readonly item: Schema<T>, private readonly checks: Array<(value: T[]) => void> = []) {
    super((value) => {
      if (!Array.isArray(value)) {
        throw new Error('Expected array');
      }
      const parsed = value.map((entry) => item.parse(entry));
      for (const check of checks) {
        check(parsed);
      }
      return parsed;
    });
  }

  min(length: number, message?: string): ArraySchema<T> {
    return new ArraySchema(this.item, [
      ...this.checks,
      (value) => {
        if (value.length < length) {
          throw new Error(message ?? `Expected at least ${length} items`);
        }
      },
    ]);
  }

  nonempty(message = 'Array must not be empty'): ArraySchema<T> {
    return this.min(1, message);
  }
}

class ObjectSchema<T extends Record<string, any>> extends Schema<T> {
  constructor(private readonly shape: { [K in keyof T]: Schema<T[K]> }) {
    super((value) => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error('Expected object');
      }
      const result: Record<string, any> = {};
      for (const key of Object.keys(shape) as (keyof T)[]) {
        result[key as string] = shape[key].parse((value as Record<string, unknown>)[key as string]);
      }
      return result as T;
    });
  }

  extend<U extends Record<string, any>>(addition: { [K in keyof U]: Schema<U[K]> }): ObjectSchema<T & U> {
    return new ObjectSchema({ ...(this.shape as object), ...addition } as any);
  }
}

class EnumSchema<T extends string> extends Schema<T> {
  constructor(private readonly options: readonly T[]) {
    super((value) => {
      if (typeof value !== 'string' || !options.includes(value as T)) {
        throw new Error(`Expected one of: ${options.join(', ')}`);
      }
      return value as T;
    });
  }
}

export const z = {
  string: () => new StringSchema((value) => {
    if (typeof value !== 'string') {
      throw new Error('Expected string');
    }
    return value;
  }),
  number: () => new NumberSchema((value) => {
    if (typeof value !== 'number') {
      throw new Error('Expected number');
    }
    return value;
  }),
  boolean: () => new BooleanSchema((value) => {
    if (typeof value !== 'boolean') {
      throw new Error('Expected boolean');
    }
    return value;
  }),
  array: <T>(item: Schema<T>) => new ArraySchema(item),
  object: <T extends Record<string, any>>(shape: { [K in keyof T]: Schema<T[K]> }) => new ObjectSchema(shape),
  enum: <T extends readonly [string, ...string[]]>(options: T) => new EnumSchema(options as unknown as string[]) as EnumSchema<T[number]>,
  literal: <T>(value: T) =>
    new Schema<T>((input) => {
      if (input !== value) {
        throw new Error(`Expected literal ${String(value)}`);
      }
      return value;
    }),
};

export type Infer<T> = T extends Schema<infer U> ? U : never;
