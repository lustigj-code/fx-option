import { useMemo } from 'react';

import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';

import type { Role } from '@shared/auth';

const parseEnvList = (value: string | undefined): Role[] => {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry): entry is Role => !!entry);
};

const mfaRequiredRoles = new Set<Role>(parseEnvList(process.env.PORTAL_REQUIRE_MFA_ROLES));

export type AuthorizationStatus = 'loading' | 'authorized' | 'unauthenticated' | 'forbidden';
export type ForbiddenReason = 'missing-role' | 'mfa-required' | 'unauthenticated';

export interface UseAuthorizationOptions {
  requiredRoles?: Role[];
  loginPath?: string;
  accessDeniedPath?: string;
  mfaPath?: string;
  requireMfa?: boolean;
}

export interface UseAuthorizationResult {
  status: AuthorizationStatus;
  shouldRender: boolean;
  redirectPath?: string;
  reason?: ForbiddenReason;
  session: Session | null;
}

const shouldEnforceMfa = (roles: Role[], requireMfa?: boolean, mfaVerified?: boolean): boolean => {
  if (requireMfa === false) {
    return false;
  }
  const requires = requireMfa ?? roles.some((role) => mfaRequiredRoles.has(role));
  return requires && !mfaVerified;
};

export const useAuthorization = (options: UseAuthorizationOptions = {}): UseAuthorizationResult => {
  const { requiredRoles = [], loginPath = '/login', accessDeniedPath = '/access-denied', mfaPath = '/mfa', requireMfa } = options;
  const { data: session, status } = useSession();

  return useMemo<UseAuthorizationResult>(() => {
    if (status === 'loading') {
      return {
        status: 'loading',
        shouldRender: false,
        session: session ?? null,
      };
    }

    if (!session || !session.user) {
      return {
        status: 'unauthenticated',
        shouldRender: false,
        redirectPath: loginPath,
        reason: 'unauthenticated',
        session: null,
      };
    }

    const roles = session.user.roles ?? [];
    if (requiredRoles.length > 0 && !requiredRoles.some((role) => roles.includes(role))) {
      return {
        status: 'forbidden',
        shouldRender: false,
        redirectPath: accessDeniedPath,
        reason: 'missing-role',
        session,
      };
    }

    if (shouldEnforceMfa(roles, requireMfa, session.user.mfaVerified)) {
      return {
        status: 'forbidden',
        shouldRender: false,
        redirectPath: mfaPath,
        reason: 'mfa-required',
        session,
      };
    }

    return {
      status: 'authorized',
      shouldRender: true,
      session,
    };
  }, [session, status, requiredRoles, loginPath, accessDeniedPath, mfaPath, requireMfa]);
};

export default useAuthorization;
