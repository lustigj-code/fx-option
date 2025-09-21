import 'server-only';

import type { AuthAuditEvent, AuthAuditEventType } from './audit-types';

interface RawAuditEvent {
  id: number | string;
  eventType: string;
  userId: string;
  roles?: string[];
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
}

const FALLBACK_EVENTS: AuthAuditEvent[] = [
  {
    id: 'fallback-1',
    eventType: 'LOGIN_SUCCESS',
    userId: 'sara@fxoption.com',
    roles: ['treasury_manager'],
    ip: '10.18.31.8',
    userAgent: 'Mozilla/5.0',
    metadata: { sessionId: 'sess-001', source: 'fallback' },
    timestamp: '2024-05-12T08:21:00Z'
  },
  {
    id: 'fallback-2',
    eventType: 'ACCESS_DENIED',
    userId: 'liam@fxoption.com',
    roles: ['risk_analyst'],
    ip: '10.18.31.14',
    userAgent: 'Mozilla/5.0',
    metadata: { route: '/admin/settings', requiredRoles: ['admin'], source: 'fallback' },
    timestamp: '2024-05-12T08:28:00Z'
  },
  {
    id: 'fallback-3',
    eventType: 'LOGIN_FAILURE',
    userId: 'auditor@clientbank.com',
    roles: [],
    ip: '10.18.32.5',
    userAgent: 'Mozilla/5.0',
    metadata: { failureReason: 'INVALID_CREDENTIALS', source: 'fallback' },
    timestamp: '2024-05-12T08:33:00Z'
  },
  {
    id: 'fallback-4',
    eventType: 'LOGOUT',
    userId: 'priya@fxoption.com',
    roles: ['admin'],
    ip: '10.18.30.7',
    userAgent: 'Mozilla/5.0',
    metadata: { source: 'fallback' },
    timestamp: '2024-05-12T08:45:00Z'
  }
];

const AUDIT_SERVICE_URL = process.env.ADMIN_AUDIT_SERVICE_URL ?? process.env.AUDIT_SERVICE_URL ?? null;

const coerceArray = (value: unknown): string[] => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  return String(value)
    .split(/\s+/)
    .filter(Boolean);
};

const coerceMetadata = (value: unknown): Record<string, unknown> => {
  if (!value) {
    return {};
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { note: String(value) };
};

const normalizeEvent = (event: RawAuditEvent): AuthAuditEvent => {
  return {
    id: String(event.id),
    eventType: (event.eventType as AuthAuditEventType) ?? 'ACCESS_DENIED',
    userId: event.userId,
    roles: coerceArray(event.roles),
    ip: event.ip ?? null,
    userAgent: event.userAgent ?? null,
    metadata: coerceMetadata(event.metadata),
    timestamp: event.timestamp
  };
};

export async function fetchAuditEvents(limit = 100): Promise<AuthAuditEvent[]> {
  if (!AUDIT_SERVICE_URL) {
    return FALLBACK_EVENTS.slice(0, limit);
  }

  try {
    const url = new URL('/events/auth', AUDIT_SERVICE_URL);
    url.searchParams.set('limit', String(limit));
    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { 'accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Audit service returned ${response.status}`);
    }

    const payload = (await response.json()) as RawAuditEvent[];
    if (!Array.isArray(payload)) {
      throw new Error('Audit payload malformed');
    }

    return payload.map(normalizeEvent);
  } catch (error) {
    console.error('[admin] failed to load audit events', error);
    return FALLBACK_EVENTS.slice(0, limit);
  }
}

export function formatMetadata(metadata: Record<string, unknown>): string {
  if (Object.keys(metadata).length === 0) {
    return '—';
  }
  return Object.entries(metadata)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
}

export function eventsToday(events: AuthAuditEvent[], now: Date = new Date()): number {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  return events.filter((event) => {
    const ts = new Date(event.timestamp);
    return ts >= midnight;
  }).length;
}

export const fallbackAuditEvents = FALLBACK_EVENTS;
