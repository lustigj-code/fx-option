import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { decode, encode } from 'next-auth/jwt';

import { authOptions } from '@/lib/auth-options';
import { verifyMfa } from '@shared/auth';

import { mfaVerificationRequestSchema } from '../../../../../../../specs/003-implement-secure-authentication/contracts/auth';

const SESSION_COOKIE_NAMES = ['next-auth.session-token', '__Secure-next-auth.session-token'];
const isProduction = process.env.NODE_ENV === 'production';

const updateSessionToken = async (
  request: NextRequest,
  response: NextResponse,
  overrides: Record<string, unknown>,
) => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.warn('[auth] NEXTAUTH_SECRET is not defined; unable to update session token.');
    return;
  }

  for (const cookieName of SESSION_COOKIE_NAMES) {
    const cookie = request.cookies.get(cookieName);
    if (!cookie?.value) {
      continue;
    }

    const decoded = await decode({ token: cookie.value, secret });
    if (!decoded) {
      continue;
    }

    const updatedToken = await encode({ token: { ...decoded, ...overrides }, secret });
    response.cookies.set(cookieName, updatedToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
    });
  }
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    body = {};
  }

  const payload = mfaVerificationRequestSchema.parse({
    ...(typeof body === 'object' && body ? body : {}),
    userId: session.user.id,
  });

  const result = verifyMfa(payload);
  if (!result.verified) {
    return NextResponse.json(
      { verified: false, error: 'Invalid or expired authentication code.' },
      { status: 400 },
    );
  }

  const response = NextResponse.json(result);
  await updateSessionToken(request, response, { mfaVerified: true });

  return response;
}
