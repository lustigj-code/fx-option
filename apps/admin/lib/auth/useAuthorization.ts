import { useMemo } from 'react';

import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';

import type { Role } from '@shared/auth';

export type AuthorizationStatus = 'loading' | 'authorized' | 'unauthenticated' | 'forbidden';
export type ForbiddenReason = 'missing-role' | 'mfa-required' | 'unauthenticated';

export interface UseAuthorizationOptions {
  requiredRoles?: Role[];
  loginPath?: string;
  accessDeniedPath?: string;
  mfaPath?: string;
}

export interface UseAuthorizationResult {
  status: AuthorizationStatus;
  shouldRender: boolean;
  redirectPath?: string;
  reason?: ForbiddenReason;
  session: Session | null;
}

const DEFAULT_PRIVILEGED_ROLES: Role[] = ['compliance_officer', 'admin'];

const normalizeRoles = (roles: Role[] | undefined | null): Role[] => Array.isArray(roles) ? roles : [];

export const useAuthorization = (options: UseAuthorizationOptions = {}): UseAuthorizationResult => {
  const { requiredRoles = DEFAULT_PRIVILEGED_ROLES, loginPath = '/login', accessDeniedPath = '/access-denied', mfaPath = '/mfa' } = options;
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

    const roles = normalizeRoles(session.user.roles);
    if (requiredRoles.length > 0 && !requiredRoles.some((role) => roles.includes(role))) {
      return {
        status: 'forbidden',
        shouldRender: false,
        redirectPath: accessDeniedPath,
        reason: 'missing-role',
        session,
      };
    }

    if (session.user.mfaRequired && !session.user.mfaVerified) {
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
  }, [session, status, requiredRoles, loginPath, accessDeniedPath, mfaPath]);
};

export default useAuthorization;
