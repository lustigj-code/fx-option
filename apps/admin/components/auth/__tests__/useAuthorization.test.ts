import { createEmptySession } from '@shared/auth';
import { evaluateAdminAuthorization, type UseAdminAuthorizationOptions } from '@/lib/auth/useAuthorization';

describe('evaluateAdminAuthorization', () => {
  const baseSession = createEmptySession();

  const authorize = (
    status: 'authenticated' | 'loading' | 'unauthenticated',
    options: UseAdminAuthorizationOptions,
    session: ReturnType<typeof createEmptySession> | null,
  ) => evaluateAdminAuthorization(session, status, options);

  it('defaults to privileged roles when none are specified', () => {
    const session = {
      ...baseSession,
      user: { ...baseSession.user, id: 'admin-1', roles: ['admin'], mfaVerified: true },
    };

    const result = authorize('authenticated', {}, session);

    expect(result.isAuthorized).toBe(true);
    expect(result.reason).toBe('authorized');
  });

  it('rejects users that lack the required role set', () => {
    const session = {
      ...baseSession,
      user: { ...baseSession.user, id: 'user-2', roles: ['treasury_manager'], mfaVerified: true },
    };

    const result = authorize('authenticated', { allowedRoles: ['admin'] }, session);

    expect(result.isAuthorized).toBe(false);
    expect(result.reason).toBe('insufficient-role');
  });

  it('requires MFA completion before granting access', () => {
    const session = {
      ...baseSession,
      user: { ...baseSession.user, id: 'user-3', roles: ['compliance_officer'], mfaVerified: false },
    };

    const result = authorize('authenticated', { allowedRoles: ['compliance_officer'] }, session);

    expect(result.isAuthorized).toBe(false);
    expect(result.requiresMfa).toBe(true);
    expect(result.reason).toBe('mfa-required');
  });

  it('reports unauthenticated state when there is no active session', () => {
    const result = authorize('unauthenticated', {}, null);

    expect(result.isAuthorized).toBe(false);
    expect(result.reason).toBe('unauthenticated');
  });
});
