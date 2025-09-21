declare const process: {
  env: Record<string, string | undefined> & {
    NODE_ENV?: string;
    NEXT_PUBLIC_GATEWAY_BASE_URL?: string;
    NEXT_PUBLIC_API_BASE_URL?: string;
    NEXT_PUBLIC_GATEWAY_ENABLED?: string;
    NEXT_PUBLIC_GATEWAY_POLL_INTERVAL_MS?: string;
    NEXT_PUBLIC_GATEWAY_MAX_BACKOFF_MS?: string;
    NEXT_PUBLIC_GATEWAY_RETRY_LIMIT?: string;
  };
};

interface RequestInit {
  method?: string;
  headers?: Record<string, string> | undefined;
  body?: string;
}

interface Response {
  ok: boolean;
  status: number;
  json(): Promise<any>;
  text(): Promise<string>;
}

type RequestInfo = string;

declare function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;

declare const performance:
  | {
      now(): number;
    }
  | undefined;
