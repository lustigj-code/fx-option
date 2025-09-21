import { createGatewayClient } from '@shared/api';

const client = createGatewayClient({
  baseUrl: 'http://localhost:8000',
  pollIntervalMs: 10_000,
  maxBackoffMs: 60_000,
  maxRetries: 3,
  backoffJitter: 0.2,
});

void client;
