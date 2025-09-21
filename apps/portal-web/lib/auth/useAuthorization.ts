import { useMemo } from 'react';
import { useSession } from 'next-auth/react';

import { sessionRequiresMfa, type AppRole, type AuthSession } from '@shared/auth';

export type AuthorizationStatus = 'loading' | 'unauthenticated' | 'authorized' | 'insufficient-role' | 'mfa-required';

export interface UseAuthorizationOptions {
  allowedRoles?: AppRole[];
  requireAll?: boolean;
}

export interface UseAuthorizationResult {
  status: ReturnType<typeof useSession>['status'];
  isAuthorized: boolean;
  requiresMfa: boolean;
  reason: AuthorizationStatus;
  session: ReturnType<typeof useSession>['data'];
}

const hasRequiredRoles = (userRoles: AppRole[], requiredRoles: AppRole[], requireAll: boolean): boolean => {
  if (requiredRoles.length === 0) {
    return true;
  }
  if (requireAll) {
    return requiredRoles.every((role) => userRoles.includes(role));
  }
  return requiredRoles.some((role) => userRoles.includes(role));
};

export const evaluateAuthorization = (
  session: ReturnType<typeof useSession>['data'],
  status: ReturnType<typeof useSession>['status'],
  options: UseAuthorizationOptions,
): UseAuthorizationResult => {
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

  if (!hasRequiredRoles(roles, options.allowedRoles ?? [], options.requireAll ?? false)) {
    return {
      status,
      isAuthorized: false,
      requiresMfa: false,
      reason: 'insufficient-role',
      session,
    };
  }

  return {
    status,
    isAuthorized: true,
    requiresMfa: false,
    reason: 'authorized',
    session,
  };
};

export const useAuthorization = (options: UseAuthorizationOptions = {}): UseAuthorizationResult => {
  const { data: session, status } = useSession();

  return useMemo<UseAuthorizationResult>(
    () => evaluateAuthorization(session, status, options),
    [session, status, options.allowedRoles, options.requireAll],
  );
};
