export type Role =
  | 'treasury_manager'
  | 'risk_analyst'
  | 'compliance_officer'
  | 'admin';

export const KNOWN_ROLES: Role[] = [
  'treasury_manager',
  'risk_analyst',
  'compliance_officer',
  'admin',
];

const ROLE_SET = new Set<Role>(KNOWN_ROLES);

export const ROLE_LABELS: Record<Role, string> = {
  treasury_manager: 'Treasury Manager',
  risk_analyst: 'Risk Analyst',
  compliance_officer: 'Compliance Officer',
  admin: 'Administrator',
};

export const PRIVILEGED_ROLES: Role[] = ['compliance_officer', 'admin'];

export const DEFAULT_ROLE: Role = 'treasury_manager';

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  roles: Role[];
  mfaVerified: boolean;
}

export interface AuthSession {
  user: SessionUser | null;
  expires: string | null;
}

export type SessionLike = Partial<AuthSession> & {
  user?: Partial<SessionUser> | null;
};

const filterRoles = (roles: (Role | string | undefined | null)[] | undefined | null): Role[] => {
  if (!roles) {
    return [];
  }

  const deduped = new Set<Role>();
  for (const role of roles) {
    if (!role) continue;
    const normalized = role as Role;
    if (ROLE_SET.has(normalized)) {
      deduped.add(normalized);
    }
  }

  return Array.from(deduped);
};

export const normalizeSession = (session: SessionLike | null | undefined): AuthSession => {
  const user = session?.user ?? null;

  return {
    user: user
      ? {
          id: user.id ?? '',
          name: user.name ?? null,
          email: user.email ?? null,
          roles: filterRoles(user.roles ?? []),
          mfaVerified: Boolean(user.mfaVerified),
        }
      : null,
    expires: session?.expires ?? null,
  };
};

export const getUserRoles = (session: SessionLike | null | undefined): Role[] => {
  return normalizeSession(session).user?.roles ?? [];
};

export const hasRole = (session: SessionLike | null | undefined, role: Role): boolean => {
  return getUserRoles(session).includes(role);
};

export const hasAnyRole = (session: SessionLike | null | undefined, roles: Role[]): boolean => {
  return roles.some((role) => hasRole(session, role));
};

export const hasAllRoles = (session: SessionLike | null | undefined, roles: Role[]): boolean => {
  return roles.every((role) => hasRole(session, role));
};

export const isPrivileged = (session: SessionLike | null | undefined): boolean => {
  return hasAnyRole(session, PRIVILEGED_ROLES);
};

export const requiresMfa = (session: SessionLike | null | undefined): boolean => {
  const { user } = normalizeSession(session);
  if (!user) return false;
  return isPrivileged(session) && !user.mfaVerified;
};

export const isSessionActive = (
  session: SessionLike | null | undefined,
  now: Date = new Date(),
): boolean => {
  const expires = normalizeSession(session).expires;
  if (!expires) return false;
  const expiresDate = new Date(expires);
  return expiresDate.getTime() > now.getTime();
};

export const getHighestRole = (roles: Role[] | undefined | null): Role | null => {
  if (!roles || roles.length === 0) return null;
  const ordered = [...roles].sort(
    (a, b) => KNOWN_ROLES.indexOf(a) - KNOWN_ROLES.indexOf(b),
  );
  return ordered[ordered.length - 1] ?? null;
};

export const describeRoles = (roles: Role[] | undefined | null): string => {
  return filterRoles(roles ?? [])
    .map((role) => ROLE_LABELS[role])
    .join(', ');
};

export const createAuditContext = (
  session: SessionLike | null | undefined,
): { userId: string | null; roles: Role[]; mfaVerified: boolean } => {
  const normalized = normalizeSession(session);
  if (!normalized.user) {
    return { userId: null, roles: [], mfaVerified: false };
  }

  return {
    userId: normalized.user.id || null,
    roles: normalized.user.roles,
    mfaVerified: normalized.user.mfaVerified,
  };
};

export const isRole = (role: string): role is Role => ROLE_SET.has(role as Role);

export const ensureRoles = (roles: (Role | string | undefined | null)[]): Role[] => filterRoles(roles);

export * from './errors';
