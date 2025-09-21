export const APP_ROLES = [
  "treasury_manager",
  "risk_analyst",
  "compliance_officer",
  "admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  treasury_manager: "Treasury Manager",
  risk_analyst: "Risk Analyst",
  compliance_officer: "Compliance Officer",
  admin: "Administrator",
};

const MFA_REQUIRED_ROLES: AppRole[] = ["compliance_officer", "admin"];

export interface SessionUserLike {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  roles?: string[] | null;
  mfaVerified?: boolean | null;
}

export interface SessionLike {
  user?: SessionUserLike | null;
  expires?: string | null;
}

export interface NormalizedSession {
  userId: string;
  email?: string;
  name?: string;
  roles: AppRole[];
  mfaVerified: boolean;
  expiresAt?: number;
}

const roleSet = new Set<AppRole>(APP_ROLES);

export function normalizeRoles(roles: unknown): AppRole[] {
  if (!Array.isArray(roles)) {
    return [];
  }

  const filtered = roles.filter((role): role is AppRole => roleSet.has(role as AppRole));

  return [...new Set(filtered)];
}

export function normalizeSession(session: SessionLike | null | undefined): NormalizedSession | null {
  if (!session?.user?.id) {
    return null;
  }

  const roles = normalizeRoles(session.user.roles ?? []);

  return {
    userId: session.user.id,
    email: session.user.email ?? undefined,
    name: session.user.name ?? undefined,
    roles,
    mfaVerified: Boolean(session.user.mfaVerified),
    expiresAt: session.expires ? Date.parse(session.expires) : undefined,
  };
}

export function hasRole(session: NormalizedSession | null, role: AppRole): boolean {
  if (!session) {
    return false;
  }

  return session.roles.includes(role);
}

export function hasAnyRole(session: NormalizedSession | null, roles: AppRole[]): boolean {
  if (!session) {
    return false;
  }

  return roles.some((role) => hasRole(session, role));
}

export function requiresMfa(role: AppRole): boolean {
  return MFA_REQUIRED_ROLES.includes(role);
}

export function isMfaSatisfied(session: NormalizedSession | null): boolean {
  if (!session) {
    return false;
  }

  if (!session.roles.some((role) => requiresMfa(role))) {
    return true;
  }

  return session.mfaVerified;
}

export function canAccess(session: NormalizedSession | null, requiredRoles: AppRole | AppRole[]): boolean {
  if (!session) {
    return false;
  }

  const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  if (rolesToCheck.length === 0) {
    return true;
  }

  return rolesToCheck.every((role) => hasRole(session, role));
}
