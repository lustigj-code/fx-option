import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { isGatewayEnabled, readGatewayConfig } from '../config';

const MANAGED_KEYS = [
  'NEXT_PUBLIC_GATEWAY_ENABLED',
  'NEXT_PUBLIC_GATEWAY_BASE_URL',
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_GATEWAY_POLL_INTERVAL_MS',
  'NEXT_PUBLIC_GATEWAY_MAX_BACKOFF_MS',
  'NEXT_PUBLIC_GATEWAY_RETRY_LIMIT',
];

const baselineEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of MANAGED_KEYS) {
    baselineEnv[key] = process.env[key];
  }
});

afterEach(() => {
  for (const key of MANAGED_KEYS) {
    const original = baselineEnv[key];
    if (typeof original === 'undefined') {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
});

describe('readGatewayConfig', () => {
  it('returns disabled defaults when environment variables are missing', () => {
    for (const key of MANAGED_KEYS) {
      delete process.env[key];
    }

    const config = readGatewayConfig();
    assert.equal(config.enabled, false);
    assert.equal(config.baseUrl, 'http://localhost:8000');
    assert.equal(config.pollIntervalMs, 10_000);
    assert.equal(config.maxBackoffMs, 60_000);
    assert.equal(config.retryLimit, 3);
  });

  it('parses environment overrides for base url and polling configuration', () => {
    process.env.NEXT_PUBLIC_GATEWAY_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GATEWAY_BASE_URL = 'https://gateway.fx';
    process.env.NEXT_PUBLIC_GATEWAY_POLL_INTERVAL_MS = '15000';
    process.env.NEXT_PUBLIC_GATEWAY_MAX_BACKOFF_MS = '120000';
    process.env.NEXT_PUBLIC_GATEWAY_RETRY_LIMIT = '5';

    const config = readGatewayConfig();
    assert.equal(config.enabled, true);
    assert.equal(config.baseUrl, 'https://gateway.fx');
    assert.equal(config.pollIntervalMs, 15_000);
    assert.equal(config.maxBackoffMs, 120_000);
    assert.equal(config.retryLimit, 5);
  });

  it('falls back to NEXT_PUBLIC_API_BASE_URL when gateway base url is not provided', () => {
    delete process.env.NEXT_PUBLIC_GATEWAY_BASE_URL;
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://fallback.fx';

    const config = readGatewayConfig();
    assert.equal(config.baseUrl, 'https://fallback.fx');
  });
});

describe('isGatewayEnabled', () => {
  it('interprets truthy string flags', () => {
    process.env.NEXT_PUBLIC_GATEWAY_ENABLED = '1';
    assert.equal(isGatewayEnabled(), true);
    process.env.NEXT_PUBLIC_GATEWAY_ENABLED = 'true';
    assert.equal(isGatewayEnabled(), true);
  });

  it('defaults to false when unset or explicitly disabled', () => {
    delete process.env.NEXT_PUBLIC_GATEWAY_ENABLED;
    assert.equal(isGatewayEnabled(), false);
    process.env.NEXT_PUBLIC_GATEWAY_ENABLED = 'false';
    assert.equal(isGatewayEnabled(), false);
  });
});
