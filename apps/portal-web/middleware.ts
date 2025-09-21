import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { rolesRequireMfa, type AppRole } from '@shared/auth';
import { emitAccessDenied } from '@shared/auth/audit';

interface RoutePolicy {
  pattern: RegExp;
  allowedRoles: AppRole[];
}

const RESTRICTED_ROUTES: RoutePolicy[] = [
  {
    pattern: /^\/app\/settings/,
    allowedRoles: ['compliance_officer', 'admin'],
  },
];

const resolvePolicy = (pathname: string): RoutePolicy | undefined =>
  RESTRICTED_ROUTES.find((entry) => entry.pattern.test(pathname));

const redirectWithCallback = (request: NextRequest, pathname: string) => {
  const url = new URL(pathname, request.url);
  url.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return redirectWithCallback(request, '/auth/login');
  }

  const roles = Array.isArray(token.roles) ? (token.roles as AppRole[]) : [];
  const policy = resolvePolicy(request.nextUrl.pathname);
  const userId = (typeof token.userId === 'string' && token.userId) || (typeof token.sub === 'string' ? token.sub : 'unknown');
  const email = typeof token.email === 'string' ? token.email : null;
  const clientIp = (token.ip as string) ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.ip ?? null;
  const userAgent = (token.userAgent as string) ?? request.headers.get('user-agent') ?? null;

  if (roles.length === 0 && policy) {
    await emitAccessDenied({
      userId,
      email,
      roles,
      ip: clientIp,
      userAgent,
      route: request.nextUrl.pathname,
      requiredRoles: policy.allowedRoles,
      reason: 'NO_ROLE_ASSIGNMENT',
    });
    return redirectWithCallback(request, '/auth/access-denied');
  }

  if (rolesRequireMfa(roles) && !token.mfaVerified) {
    await emitAccessDenied({
      userId,
      email,
      roles,
      ip: clientIp,
      userAgent,
      route: request.nextUrl.pathname,
      requiredRoles: [],
      reason: 'MFA_REQUIRED',
    });
    return redirectWithCallback(request, '/auth/mfa');
  }

  if (policy && !policy.allowedRoles.some((role) => roles.includes(role))) {
    const deniedUrl = new URL('/auth/access-denied', request.url);
    deniedUrl.searchParams.set('route', request.nextUrl.pathname);
    deniedUrl.searchParams.set('required', policy.allowedRoles.join(','));
    await emitAccessDenied({
      userId,
      email,
      roles,
      ip: clientIp,
      userAgent,
      route: request.nextUrl.pathname,
      requiredRoles: policy.allowedRoles,
      reason: 'INSUFFICIENT_ROLE',
    });
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
