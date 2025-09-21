import { evaluateAuthorization, type UseAuthorizationOptions } from '@/lib/auth/useAuthorization';
import { createEmptySession } from '@shared/auth';

describe('evaluateAuthorization', () => {
  const baseSession = createEmptySession();

  const authorize = (
    status: 'authenticated' | 'loading' | 'unauthenticated',
    options: UseAuthorizationOptions,
    session: ReturnType<typeof createEmptySession> | null,
  ) => evaluateAuthorization(session, status, options);

  it('returns loading state while the session resolves', () => {
    const result = authorize('loading', { allowedRoles: ['treasury_manager'] }, null);

    expect(result.status).toBe('loading');
    expect(result.isAuthorized).toBe(false);
    expect(result.reason).toBe('loading');
  });

  it('authorizes sessions that include at least one allowed role', () => {
    const session = {
      ...baseSession,
      user: { ...baseSession.user, id: 'user-1', roles: ['treasury_manager'], mfaVerified: true },
    };

    const result = authorize('authenticated', { allowedRoles: ['treasury_manager'] }, session);

    expect(result.isAuthorized).toBe(true);
    expect(result.reason).toBe('authorized');
    expect(result.requiresMfa).toBe(false);
  });

  it('rejects sessions missing required roles', () => {
    const session = {
      ...baseSession,
      user: { ...baseSession.user, id: 'user-2', roles: ['treasury_manager'], mfaVerified: true },
    };

    const result = authorize('authenticated', { allowedRoles: ['admin'] }, session);

    expect(result.isAuthorized).toBe(false);
    expect(result.reason).toBe('insufficient-role');
  });

  it('requests MFA when privileged roles are present but not verified', () => {
    const session = {
      ...baseSession,
      user: { ...baseSession.user, id: 'user-3', roles: ['compliance_officer'], mfaVerified: false },
    };

    const result = authorize('authenticated', { allowedRoles: ['compliance_officer'] }, session);

    expect(result.isAuthorized).toBe(false);
    expect(result.reason).toBe('mfa-required');
    expect(result.requiresMfa).toBe(true);
  });

  it('reports unauthenticated state when no session is available', () => {
    const result = authorize('unauthenticated', { allowedRoles: ['treasury_manager'] }, null);

    expect(result.isAuthorized).toBe(false);
    expect(result.reason).toBe('unauthenticated');
  });
});
