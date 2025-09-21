/**
 * Shared authentication helpers and role definitions used across portal and admin apps.
 *
 * The helpers in this module intentionally avoid importing runtime dependencies so the
 * workspace can share a single source of truth for RBAC policy and session semantics.
 */

export const APP_ROLES = [
  "treasury_manager",
  "risk_analyst",
  "compliance_officer",
  "admin",
] as const;

/**
 * Canonical role identifiers available to the workspace.
 */
export type AppRole = (typeof APP_ROLES)[number];

/**
 * Provides human friendly labels for UI display.
 */
export const ROLE_LABELS: Record<AppRole, string> = {
  treasury_manager: "Treasury Manager",
  risk_analyst: "Risk Analyst",
  compliance_officer: "Compliance Officer",
  admin: "Administrator",
};

/**
 * Defines the ordering of roles from least to most privileged.
 */
export const ROLE_HIERARCHY: readonly AppRole[] = [
  "treasury_manager",
  "risk_analyst",
  "compliance_officer",
  "admin",
];

/**
 * Roles that require multi-factor authentication before privileged access is granted.
 */
export const MFA_REQUIRED_ROLES: ReadonlySet<AppRole> = new Set([
  "compliance_officer",
  "admin",
]);

/**
 * Utility type for any object that exposes role information.
 */
export type RoleHolder = {
  roles: AppRole[];
};

/**
 * Shape of a user object within an authenticated session.
 */
export interface SessionUser extends RoleHolder {
  id: string;
  name?: string | null;
  email?: string | null;
  mfaVerified: boolean;
}

/**
 * Minimal session representation used by the front-end surfaces.
 */
export interface AuthSession {
  user: SessionUser;
  /**
   * Epoch time when the session expires.
   */
  expiresAt?: number;
  /**
   * Epoch time when the session was issued.
   */
  issuedAt?: number;
}

/**
 * Type guard validating whether an unknown role belongs to the workspace role set.
 */
export const isRole = (value: unknown): value is AppRole =>
  typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);

/**
 * Normalizes a list of unknown roles to workspace roles, discarding invalid entries.
 */
export const normalizeRoles = (roles: unknown): AppRole[] => {
  if (!Array.isArray(roles)) {
    return [];
  }

  const unique = new Set<AppRole>();
  for (const role of roles) {
    if (isRole(role)) {
      unique.add(role);
    }
  }

  return Array.from(unique).sort(
    (a, b) => ROLE_HIERARCHY.indexOf(a) - ROLE_HIERARCHY.indexOf(b),
  );
};

/**
 * Retrieves the highest privilege role assigned to the holder based on the hierarchy.
 */
export const getPrimaryRole = (holder: RoleHolder | null | undefined): AppRole | null => {
  if (!holder) {
    return null;
  }

  const sorted = [...holder.roles].sort(
    (a, b) => ROLE_HIERARCHY.indexOf(b) - ROLE_HIERARCHY.indexOf(a),
  );

  return sorted[0] ?? null;
};

/**
 * Indicates whether the provided holder includes a specific role.
 */
export const hasRole = (
  holder: RoleHolder | null | undefined,
  role: AppRole,
): holder is RoleHolder => {
  if (!holder) {
    return false;
  }

  return holder.roles.includes(role);
};

/**
 * Determines if a holder has at least one of the requested roles.
 */
export const hasAnyRole = (
  holder: RoleHolder | null | undefined,
  roles: readonly AppRole[],
): boolean => {
  if (!holder || roles.length === 0) {
    return false;
  }

  return roles.some((role) => hasRole(holder, role));
};

/**
 * Determines if a holder has all of the requested roles.
 */
export const hasAllRoles = (
  holder: RoleHolder | null | undefined,
  roles: readonly AppRole[],
): boolean => {
  if (!holder) {
    return false;
  }

  return roles.every((role) => hasRole(holder, role));
};

/**
 * Evaluates whether any of the roles in the list require MFA enforcement.
 */
export const rolesRequireMfa = (roles: readonly AppRole[]): boolean =>
  roles.some((role) => MFA_REQUIRED_ROLES.has(role));

/**
 * Determines if a session should be blocked pending MFA verification.
 */
export const sessionRequiresMfa = (session: AuthSession | null | undefined): boolean => {
  if (!session) {
    return false;
  }

  const { user } = session;
  if (!user) {
    return false;
  }

  return rolesRequireMfa(user.roles) && !user.mfaVerified;
};

/**
 * Ensures a session object contains normalized roles. Useful when hydrating from
 * callbacks or API responses.
 */
export const withNormalizedRoles = <T extends { user?: Partial<SessionUser> | null }>(
  session: T,
): T & { user: SessionUser } => {
  const normalizedRoles = normalizeRoles(session.user?.roles ?? []);
  const user: SessionUser = {
    id: session.user?.id ?? "",
    name: session.user?.name ?? null,
    email: session.user?.email ?? null,
    roles: normalizedRoles,
    mfaVerified: Boolean(session.user?.mfaVerified),
  };

  return {
    ...session,
    user,
  } as T & { user: SessionUser };
};

/**
 * Generates a default unauthenticated session structure for initial state usage.
 */
export const createEmptySession = (): AuthSession => ({
  user: {
    id: "",
    name: null,
    email: null,
    roles: [],
    mfaVerified: false,
  },
});

export {
  ensureMfaEnrollment,
  verifyMfa,
  isMfaVerified,
  getEnrollmentSummary,
  resetMfaEnrollment,
} from './mfa';

export type {
  EnrollmentPayload as MfaEnrollmentPayload,
  VerificationPayload as MfaVerificationPayload,
  EnrollmentResponse as MfaEnrollment,
  VerificationResponse as MfaVerification,
} from './mfa';

export {
  createLoginController,
} from './login-controller';

export type {
  LoginController,
  LoginControllerMessages,
  LoginControllerOptions,
  LoginControllerState,
  LoginCredentials,
} from './login-controller';
