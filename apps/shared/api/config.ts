export interface GatewayConfig {
  enabled: boolean;
  baseUrl: string;
  pollIntervalMs: number;
  maxBackoffMs: number;
  retryLimit: number;
}

const DEFAULT_BASE_URL = 'http://localhost:8000';
const DEFAULT_POLL_INTERVAL = 10_000;
const DEFAULT_MAX_BACKOFF = 60_000;
const DEFAULT_RETRY_LIMIT = 3;

type Env = Record<string, string | undefined>;

export const readGatewayConfig = (env: Env = process.env): GatewayConfig => {
  const enabled = parseBoolean(env.NEXT_PUBLIC_GATEWAY_ENABLED, false);
  const baseUrl =
    env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;
  const pollIntervalMs = parseNumber(env.NEXT_PUBLIC_GATEWAY_POLL_INTERVAL_MS, DEFAULT_POLL_INTERVAL);
  const maxBackoffMs = parseNumber(env.NEXT_PUBLIC_GATEWAY_MAX_BACKOFF_MS, DEFAULT_MAX_BACKOFF);
  const retryLimit = parseNumber(env.NEXT_PUBLIC_GATEWAY_RETRY_LIMIT, DEFAULT_RETRY_LIMIT);

  return {
    enabled,
    baseUrl,
    pollIntervalMs,
    maxBackoffMs,
    retryLimit,
  };
};

export const isGatewayEnabled = (env: Env = process.env): boolean => {
  return readGatewayConfig(env).enabled;
};

const parseNumber = (input: string | undefined, fallback: number): number => {
  if (!input) return fallback;
  const parsed = Number.parseInt(input, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (input: string | undefined, fallback: boolean): boolean => {
  if (typeof input === 'undefined') {
    return fallback;
  }
  const normalized = input.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false;
  }
  return fallback;
};
