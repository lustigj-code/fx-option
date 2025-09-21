import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { rolesRequireMfa, type AppRole } from '@shared/auth';
import { emitAccessDenied } from '@shared/auth/audit';
import { privilegedRoles } from '@/lib/auth-options';

interface RoutePolicy {
  pattern: RegExp;
  allowedRoles: AppRole[];
}

const RESTRICTED_ROUTES: RoutePolicy[] = [
  { pattern: /^\/compliance/, allowedRoles: ['compliance_officer', 'admin'] },
  { pattern: /^\/settings/, allowedRoles: ['admin'] },
];

const resolvePolicy = (pathname: string) => RESTRICTED_ROUTES.find((policy) => policy.pattern.test(pathname));

const redirectWithCallback = (request: NextRequest, target: string) => {
  const url = new URL(target, request.url);
  url.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
};

const isPublicPath = (pathname: string) => pathname.startsWith('/auth/login') || pathname.startsWith('/api/auth');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (token && pathname.startsWith('/auth/login')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return redirectWithCallback(request, '/auth/login');
  }

  const roles = Array.isArray(token.roles) ? (token.roles as AppRole[]) : [];
  const userId = (typeof token.userId === 'string' && token.userId) || (typeof token.sub === 'string' ? token.sub : 'unknown');
  const email = typeof token.email === 'string' ? token.email : null;
  const ip = (token.ip as string) ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.ip ?? null;
  const userAgent = (token.userAgent as string) ?? request.headers.get('user-agent') ?? null;
  if (rolesRequireMfa(roles) && !token.mfaVerified) {
    await emitAccessDenied({
      userId,
      email,
      roles,
      ip,
      userAgent,
      route: pathname,
      requiredRoles: [],
      reason: 'MFA_REQUIRED',
    });
    return redirectWithCallback(request, '/auth/mfa');
  }

  if (!roles.some((role) => privilegedRoles.includes(role))) {
    await emitAccessDenied({
      userId,
      email,
      roles,
      ip,
      userAgent,
      route: pathname,
      requiredRoles: privilegedRoles,
      reason: 'INSUFFICIENT_ROLE',
    });
    return redirectWithCallback(request, '/auth/access-denied');
  }

  const policy = resolvePolicy(pathname);
  if (policy && !policy.allowedRoles.some((role) => roles.includes(role))) {
    const deniedUrl = new URL('/auth/access-denied', request.url);
    deniedUrl.searchParams.set('route', pathname);
    deniedUrl.searchParams.set('required', policy.allowedRoles.join(','));
    await emitAccessDenied({
      userId,
      email,
      roles,
      ip,
      userAgent,
      route: pathname,
      requiredRoles: policy.allowedRoles,
      reason: 'INSUFFICIENT_ROLE',
    });
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
