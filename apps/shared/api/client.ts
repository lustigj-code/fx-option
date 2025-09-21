/**
 * Placeholder gateway client shared between the portal and admin applications.
 *
 * Environment variables recognised by this client:
 * - `NEXT_PUBLIC_GATEWAY_POLL_INTERVAL_MS`: default polling cadence in milliseconds.
 * - `NEXT_PUBLIC_GATEWAY_MAX_BACKOFF_MS`: upper bound for exponential backoff.
 * - `NEXT_PUBLIC_GATEWAY_MAX_RETRIES`: limit for consecutive retry attempts before surfacing an outage.
 * - `NEXT_PUBLIC_GATEWAY_BACKOFF_JITTER`: optional jitter coefficient (0-1) applied to retries.
 */
export interface GatewayClientOptions {
  /** Fully qualified URL to the FastAPI gateway (e.g. http://localhost:8000). */
  baseUrl: string;
  /** Polling cadence override in milliseconds. */
  pollIntervalMs?: number;
  /** Maximum backoff delay override in milliseconds. */
  maxBackoffMs?: number;
  /** Maximum retry attempts override. */
  maxRetries?: number;
  /** Backoff jitter multiplier override (0-1). */
  backoffJitter?: number;
}

export interface GatewayClientConfig {
  baseUrl: string;
  pollIntervalMs: number;
  maxBackoffMs: number;
  maxRetries: number;
  backoffJitter: number;
}

export interface GatewayClientPlaceholder {
  /** Returns the resolved runtime configuration for polling/backoff. */
  getConfig(): GatewayClientConfig;
}

export const GATEWAY_CLIENT_ENV = {
  pollIntervalMs: 'NEXT_PUBLIC_GATEWAY_POLL_INTERVAL_MS',
  maxBackoffMs: 'NEXT_PUBLIC_GATEWAY_MAX_BACKOFF_MS',
  maxRetries: 'NEXT_PUBLIC_GATEWAY_MAX_RETRIES',
  backoffJitter: 'NEXT_PUBLIC_GATEWAY_BACKOFF_JITTER',
} as const;

const DEFAULT_CONFIG: Omit<GatewayClientConfig, 'baseUrl'> = {
  pollIntervalMs: 10_000,
  maxBackoffMs: 60_000,
  maxRetries: 3,
  backoffJitter: 0.2,
};

function readNumberFromEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveConfig(options: GatewayClientOptions): GatewayClientConfig {
  const pollIntervalMs = options.pollIntervalMs ?? readNumberFromEnv(GATEWAY_CLIENT_ENV.pollIntervalMs, DEFAULT_CONFIG.pollIntervalMs);
  const maxBackoffMs = options.maxBackoffMs ?? readNumberFromEnv(GATEWAY_CLIENT_ENV.maxBackoffMs, DEFAULT_CONFIG.maxBackoffMs);
  const maxRetries = options.maxRetries ?? readNumberFromEnv(GATEWAY_CLIENT_ENV.maxRetries, DEFAULT_CONFIG.maxRetries);
  const backoffJitter = options.backoffJitter ?? readNumberFromEnv(GATEWAY_CLIENT_ENV.backoffJitter, DEFAULT_CONFIG.backoffJitter);

  return {
    baseUrl: options.baseUrl,
    pollIntervalMs,
    maxBackoffMs,
    maxRetries,
    backoffJitter,
  };
}

export function createGatewayClient(options: GatewayClientOptions): GatewayClientPlaceholder {
  const config = resolveConfig(options);

  return {
    getConfig: () => config,
  };
}
