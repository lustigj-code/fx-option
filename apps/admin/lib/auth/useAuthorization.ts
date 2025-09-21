import { useMemo } from 'react';
import { useSession } from 'next-auth/react';

import { sessionRequiresMfa, type AppRole, type AuthSession } from '@shared/auth';

export type AuthorizationState = 'loading' | 'unauthenticated' | 'authorized' | 'insufficient-role' | 'mfa-required';

export interface UseAdminAuthorizationOptions {
  allowedRoles?: AppRole[];
  requireAll?: boolean;
}

export interface UseAdminAuthorizationResult {
  status: ReturnType<typeof useSession>['status'];
  isAuthorized: boolean;
  requiresMfa: boolean;
  reason: AuthorizationState;
  session: ReturnType<typeof useSession>['data'];
}

const hasRequiredRoles = (roles: AppRole[], allowed: AppRole[], requireAll: boolean): boolean => {
  if (allowed.length === 0) {
    return true;
  }
  return requireAll ? allowed.every((role) => roles.includes(role)) : allowed.some((role) => roles.includes(role));
};

export const evaluateAdminAuthorization = (
  session: ReturnType<typeof useSession>['data'],
  status: ReturnType<typeof useSession>['status'],
  options: UseAdminAuthorizationOptions,
): UseAdminAuthorizationResult => {
  if (status === 'loading') {
    return {
      status,
      isAuthorized: false,
      requiresMfa: false,
      reason: 'loading',
      session,
    };
  }

  if (!session) {
    return {
      status,
      isAuthorized: false,
      requiresMfa: false,
      reason: 'unauthenticated',
      session,
    };
  }

  const roles = (session.user?.roles ?? []) as AppRole[];
  const requiresMfa = sessionRequiresMfa({ user: session.user } as AuthSession);
  if (requiresMfa) {
    return {
      status,
      isAuthorized: false,
      requiresMfa: true,
      reason: 'mfa-required',
      session,
    };
  }

  const effectiveRoles = options.allowedRoles ?? privilegedRoles;
  const hasRoles = hasRequiredRoles(roles, effectiveRoles, options.requireAll ?? false);

  return {
    status,
    isAuthorized: hasRoles,
    requiresMfa: false,
    reason: hasRoles ? 'authorized' : 'insufficient-role',
    session,
  };
};

export const useAdminAuthorization = (
  options: UseAdminAuthorizationOptions = {},
): UseAdminAuthorizationResult => {
  const { data: session, status } = useSession();

  return useMemo<UseAdminAuthorizationResult>(
    () => evaluateAdminAuthorization(session, status, options),
    [options.allowedRoles, options.requireAll, session, status],
  );
};
const privilegedRoles: AppRole[] = ['compliance_officer', 'admin'];
