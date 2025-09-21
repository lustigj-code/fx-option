export type AuthEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'ACCESS_DENIED';

export interface AuthEventPayload {
  eventType: AuthEventType;
  userId: string;
  email?: string | null;
  roles: string[];
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

const resolveAuditEndpoint = (): string | null => {
  return process.env.PORTAL_AUDIT_WEBHOOK_URL ?? process.env.ADMIN_AUDIT_WEBHOOK_URL ?? process.env.AUDIT_WEBHOOK_URL ?? null;
};

export const emitAuthEvent = async (payload: AuthEventPayload): Promise<void> => {
  const endpoint = resolveAuditEndpoint();
  if (!endpoint) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[auth] audit webhook not configured', payload);
    }
    return;
  }

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        timestamp: payload.timestamp ?? new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('[auth] failed to emit audit event', error);
  }
};

export const emitLoginFailure = async (payload: Omit<AuthEventPayload, 'eventType'> & { metadata?: Record<string, unknown> }) =>
  emitAuthEvent({
    ...payload,
    eventType: 'LOGIN_FAILURE',
  });

export const emitLoginSuccess = async (payload: Omit<AuthEventPayload, 'eventType'>) =>
  emitAuthEvent({
    ...payload,
    eventType: 'LOGIN_SUCCESS',
  });

export const emitLogout = async (payload: Omit<AuthEventPayload, 'eventType'>) =>
  emitAuthEvent({
    ...payload,
    eventType: 'LOGOUT',
  });

export interface AccessDeniedEventInput extends Omit<AuthEventPayload, 'eventType'> {
  metadata?: Record<string, unknown>;
  route?: string;
  requiredRoles?: string[];
  reason?: string;
}

export const emitAccessDenied = async ({
  route,
  requiredRoles,
  reason,
  metadata,
  ...payload
}: AccessDeniedEventInput) => {
  const details: Record<string, unknown> = { ...(metadata ?? {}) };
  if (route) {
    details.route = route;
  }
  if (requiredRoles && requiredRoles.length > 0) {
    details.requiredRoles = requiredRoles;
  }
  if (reason) {
    details.reason = reason;
  }

  return emitAuthEvent({
    ...payload,
    metadata: details,
    eventType: 'ACCESS_DENIED',
  });
};
