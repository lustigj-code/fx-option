class Span {
  constructor(name, options = {}) {
    this.name = name;
    this._attributes = { ...(options.attributes ?? {}) };
    this._status = { code: SpanStatusCode.UNSET };
    this._events = [];
    this._recordedExceptions = [];
    this._ended = false;
  }

  spanContext() {
    return {
      traceId: '00000000000000000000000000000000',
      spanId: '0000000000000000',
      traceFlags: 1,
    };
  }

  setAttribute(key, value) {
    this._attributes[key] = value;
    return this;
  }

  setAttributes(attributes) {
    if (!attributes) return this;
    for (const [key, value] of Object.entries(attributes)) {
      this._attributes[key] = value;
    }
    return this;
  }

  addEvent(name, attributesOrTime, maybeAttributes) {
    let attributes = undefined;
    if (attributesOrTime && typeof attributesOrTime === 'object' && !(attributesOrTime instanceof Date)) {
      attributes = { ...attributesOrTime };
    } else if (maybeAttributes) {
      attributes = { ...maybeAttributes };
    }
    this._events.push({ name, attributes });
    return this;
  }

  setStatus(status) {
    this._status = status;
    return this;
  }

  updateName(name) {
    this.name = name;
    return this;
  }

  end() {
    this._ended = true;
  }

  isRecording() {
    return true;
  }

  recordException(exception) {
    this._recordedExceptions.push(exception);
    return this;
  }
}

class Tracer {
  startSpan(name, options) {
    return new Span(name, options);
  }
}

const trace = {
  getTracer() {
    return new Tracer();
  },
};

const SpanStatusCode = {
  UNSET: 0,
  OK: 1,
  ERROR: 2,
};

module.exports = {
  trace,
  SpanStatusCode,
};
