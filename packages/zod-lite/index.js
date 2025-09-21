class ZodError extends Error {
  constructor(issues) {
    super('Invalid input');
    this.name = 'ZodError';
    this.issues = issues;
  }
}

class BaseType {
  constructor(parseFn) {
    this._parseFn = parseFn;
    this._checks = [];
  }

  _execute(value) {
    const data = this._parseFn(value);
    for (const check of this._checks) {
      const ok = check.check(data);
      if (!ok) {
        throw new ZodError([
          {
            message: check.message ?? 'Validation failed',
            received: data,
          },
        ]);
      }
    }
    return data;
  }

  parse(value) {
    return this._execute(value);
  }

  safeParse(value) {
    try {
      return { success: true, data: this._execute(value) };
    } catch (error) {
      if (error instanceof ZodError) {
        return { success: false, error };
      }
      return {
        success: false,
        error: new ZodError([
          {
            message: error instanceof Error ? error.message : 'Unknown error',
            received: value,
          },
        ]),
      };
    }
  }

  refine(check, message) {
    this._checks.push({ check, message });
    return this;
  }

  optional() {
    return new OptionalType(this);
  }

  nullable() {
    return new NullableType(this);
  }

  default(value) {
    return new DefaultType(this, value);
  }
}

class ZodString extends BaseType {
  constructor() {
    super((value) => {
      if (typeof value !== 'string') {
        throw new ZodError([{ message: 'Expected string', received: value }]);
      }
      return value;
    });
  }

  min(length, message) {
    return this.refine((val) => val.length >= length, message ?? `Expected at least ${length} characters`);
  }

  max(length, message) {
    return this.refine((val) => val.length <= length, message ?? `Expected at most ${length} characters`);
  }

  email(message) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.refine((val) => emailRegex.test(val), message ?? 'Invalid email');
  }

  regex(pattern, message) {
    return this.refine((val) => pattern.test(val), message ?? 'Invalid format');
  }

  trim() {
    return new TransformType(this, (val) => val.trim());
  }
}

class ZodNumber extends BaseType {
  constructor() {
    super((value) => {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new ZodError([{ message: 'Expected number', received: value }]);
      }
      return value;
    });
  }

  min(minValue, message) {
    return this.refine((val) => val >= minValue, message ?? `Expected number >= ${minValue}`);
  }

  max(maxValue, message) {
    return this.refine((val) => val <= maxValue, message ?? `Expected number <= ${maxValue}`);
  }

  int(message) {
    return this.refine((val) => Number.isInteger(val), message ?? 'Expected integer');
  }

  positive(message) {
    return this.refine((val) => val > 0, message ?? 'Expected positive number');
  }

  nonnegative(message) {
    return this.refine((val) => val >= 0, message ?? 'Expected non-negative number');
  }
}

class ZodBoolean extends BaseType {
  constructor() {
    super((value) => {
      if (typeof value !== 'boolean') {
        throw new ZodError([{ message: 'Expected boolean', received: value }]);
      }
      return value;
    });
  }
}

class ZodLiteral extends BaseType {
  constructor(expected) {
    super((value) => {
      if (value !== expected) {
        throw new ZodError([{ message: `Expected literal ${expected}`, received: value }]);
      }
      return value;
    });
    this.expected = expected;
  }
}

class ZodEnum extends BaseType {
  constructor(values) {
    super((value) => {
      if (!values.includes(value)) {
        throw new ZodError([{ message: `Expected one of ${values.join(', ')}`, received: value }]);
      }
      return value;
    });
    this.values = values;
  }
}

class ZodArray extends BaseType {
  constructor(itemSchema) {
    super((value) => {
      if (!Array.isArray(value)) {
        throw new ZodError([{ message: 'Expected array', received: value }]);
      }
      return value.map((item) => itemSchema._execute(item));
    });
    this.itemSchema = itemSchema;
  }

  min(length, message) {
    return this.refine((val) => val.length >= length, message ?? `Expected at least ${length} items`);
  }
}

class ZodUnion extends BaseType {
  constructor(schemas) {
    super((value) => {
      const issues = [];
      for (const schema of schemas) {
        const result = schema.safeParse(value);
        if (result.success) {
          return result.data;
        }
        issues.push(...result.error.issues);
      }
      throw new ZodError(issues.length ? issues : [{ message: 'No union variant matched', received: value }]);
    });
    this.schemas = schemas;
  }
}

class ZodObject extends BaseType {
  constructor(shape) {
    super((value) => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new ZodError([{ message: 'Expected object', received: value }]);
      }
      const output = {};
      for (const key of Object.keys(shape)) {
        output[key] = shape[key]._execute(value[key]);
      }
      if (this._strict) {
        for (const key of Object.keys(value)) {
          if (!(key in shape)) {
            throw new ZodError([{ message: `Unexpected key: ${key}`, received: value[key] }]);
          }
        }
      }
      return output;
    });
    this.shape = shape;
    this._strict = false;
  }

  strict() {
    this._strict = true;
    return this;
  }

  extend(extension) {
    return new ZodObject({ ...this.shape, ...extension });
  }

  partial() {
    const partialShape = {};
    for (const key of Object.keys(this.shape)) {
      partialShape[key] = this.shape[key].optional();
    }
    return new ZodObject(partialShape);
  }
}

class OptionalType extends BaseType {
  constructor(inner) {
    super((value) => {
      if (value === undefined) {
        return undefined;
      }
      return inner._execute(value);
    });
    this.inner = inner;
  }
}

class NullableType extends BaseType {
  constructor(inner) {
    super((value) => {
      if (value === null) {
        return null;
      }
      return inner._execute(value);
    });
    this.inner = inner;
  }
}

class DefaultType extends BaseType {
  constructor(inner, defaultValue) {
    super((value) => {
      if (value === undefined) {
        return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
      }
      return inner._execute(value);
    });
    this.inner = inner;
  }
}

class TransformType extends BaseType {
  constructor(inner, transformer) {
    super((value) => transformer(inner._execute(value)));
    this.inner = inner;
  }
}

function literal(value) {
  return new ZodLiteral(value);
}

function enumeration(values) {
  return new ZodEnum(values);
}

function object(shape) {
  return new ZodObject(shape);
}

function string() {
  return new ZodString();
}

function number() {
  return new ZodNumber();
}

function boolean() {
  return new ZodBoolean();
}

function array(schema) {
  return new ZodArray(schema);
}

function union(schemas) {
  return new ZodUnion(schemas);
}

const z = {
  ZodError,
  object,
  string,
  number,
  boolean,
  literal,
  enum: enumeration,
  array,
  union,
};

module.exports = {
  z,
  ZodError,
};
