import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

import type { Role } from '@shared/auth';

const PUBLIC_PATHS = new Set<string>(['/login', '/access-denied', '/mfa']);
const DEFAULT_LOGIN_PATH = '/login';
const ACCESS_DENIED_PATH = '/access-denied';
const MFA_PATH = '/mfa';

const parseRoles = (value: unknown): Role[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is Role => typeof entry === 'string');
};

const requiresMfa = (roles: Role[], token: Record<string, unknown>): boolean => {
  const configured = process.env.PORTAL_REQUIRE_MFA_ROLES;
  const mfaRoles = configured
    ? configured
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry): entry is Role => entry.length > 0)
    : [];
  if (mfaRoles.length === 0) {
    return false;
  }
  const shouldRequire = roles.some((role) => mfaRoles.includes(role));
  if (!shouldRequire) {
    return false;
  }
  return !token.mfaVerified;
};

const isPublicRoute = (pathname: string): boolean => {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }
  return pathname.startsWith('/api/auth') || pathname.startsWith('/_next') || pathname.startsWith('/static');
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = DEFAULT_LOGIN_PATH;
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  const roles = parseRoles(token.roles);
  if (requiresMfa(roles, token as Record<string, unknown>)) {
    const mfaUrl = req.nextUrl.clone();
    mfaUrl.pathname = MFA_PATH;
    mfaUrl.searchParams.set('callbackUrl', req.nextUrl.href);
    return NextResponse.redirect(mfaUrl);
  }

  if (!token.userId) {
    const deniedUrl = req.nextUrl.clone();
    deniedUrl.pathname = ACCESS_DENIED_PATH;
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|_next/|favicon.ico).*)'],
};
