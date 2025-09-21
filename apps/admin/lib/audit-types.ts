export type AuthAuditEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'ACCESS_DENIED';

export interface AuthAuditEvent {
  id: string;
  eventType: AuthAuditEventType;
  userId: string;
  roles: string[];
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  timestamp: string;
}
