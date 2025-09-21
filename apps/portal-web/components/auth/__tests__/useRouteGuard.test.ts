import { renderHook } from '@testing-library/react';
import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';

import type { Role } from '@shared/auth';
import { useRouteGuard } from '../useRouteGuard';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

const mockUseSession = useSession as unknown as jest.MockedFunction<typeof useSession>;

const buildSession = (overrides?: Partial<Session['user']> & { expires?: string }): { data: Session; status: 'authenticated' } => {
  const expires = overrides?.expires ?? new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const roles: Role[] = (overrides?.roles as Role[] | undefined) ?? ['treasury_manager'];

  return {
    data: {
      expires,
      user: {
        id: overrides?.id ?? 'user-1',
        email: overrides?.email ?? 'demo@fxportal.local',
        name: overrides?.name ?? 'Demo User',
        roles,
        mfaVerified: overrides?.mfaVerified ?? true,
      } as Session['user'] & { roles: Role[]; mfaVerified: boolean },
    } as Session,
    status: 'authenticated',
  };
};

describe('useRouteGuard', () => {
  beforeEach(() => {
    mockUseSession.mockReset();
  });

  it('returns loading state while session resolves', () => {
    mockUseSession.mockReturnValue({ data: undefined, status: 'loading' } as const);

    const { result } = renderHook(() => useRouteGuard());

    expect(result.current.status).toBe('loading');
    expect(result.current.shouldRender).toBe(false);
    expect(result.current.redirectPath).toBeUndefined();
  });

  it('authorizes when required role is present', () => {
    mockUseSession.mockReturnValue(buildSession());

    const { result } = renderHook(() => useRouteGuard({ requiredRoles: ['treasury_manager'] }));

    expect(result.current.status).toBe('authorized');
    expect(result.current.shouldRender).toBe(true);
    expect(result.current.session?.user?.roles).toContain('treasury_manager');
  });

  it('blocks when role requirement is not satisfied', () => {
    mockUseSession.mockReturnValue(
      buildSession({
        roles: ['risk_analyst'],
      }),
    );

    const { result } = renderHook(() => useRouteGuard({ requiredRoles: ['admin'] }));

    expect(result.current.status).toBe('forbidden');
    expect(result.current.reason).toBe('missing-role');
    expect(result.current.redirectPath).toBe('/auth/access-denied');
    expect(result.current.shouldRender).toBe(false);
  });

  it('enforces MFA when required', () => {
    mockUseSession.mockReturnValue(
      buildSession({
        roles: ['compliance_officer'],
        mfaVerified: false,
      }),
    );

    const { result } = renderHook(() =>
      useRouteGuard({
        requiredRoles: ['compliance_officer'],
        requireMfa: true,
        mfaPath: '/auth/mfa',
      }),
    );

    expect(result.current.status).toBe('forbidden');
    expect(result.current.reason).toBe('mfa-required');
    expect(result.current.redirectPath).toBe('/auth/mfa');
  });

  it('flags unauthenticated sessions when access is protected', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' } as const);

    const { result } = renderHook(() => useRouteGuard({ loginPath: '/auth/login' }));

    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.reason).toBe('unauthenticated');
    expect(result.current.redirectPath).toBe('/auth/login');
  });
});
