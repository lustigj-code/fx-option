import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

import type { Role } from '@shared/auth';

const LOGIN_PATH = '/login';
const ACCESS_DENIED_PATH = '/access-denied';
const MFA_PATH = '/mfa';
const PUBLIC_PATHS = new Set<string>([LOGIN_PATH, '/api/auth']);
const PRIVILEGED_ROLES: Role[] = ['compliance_officer', 'admin'];

const parseRoles = (value: unknown): Role[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is Role => typeof entry === 'string');
};

const hasPrivilege = (roles: Role[]): boolean => PRIVILEGED_ROLES.some((role) => roles.includes(role));

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith('/api/auth') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  const roles = parseRoles(token.roles);
  if (!hasPrivilege(roles)) {
    const deniedUrl = req.nextUrl.clone();
    deniedUrl.pathname = ACCESS_DENIED_PATH;
    return NextResponse.redirect(deniedUrl);
  }

  if (token.mfaRequired && !token.mfaVerified) {
    const mfaUrl = req.nextUrl.clone();
    mfaUrl.pathname = MFA_PATH;
    mfaUrl.searchParams.set('callbackUrl', req.nextUrl.href);
    return NextResponse.redirect(mfaUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|_next/|favicon.ico).*)'],
};
