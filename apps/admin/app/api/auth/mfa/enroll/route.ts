import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth-options';
import { ensureMfaEnrollment } from '@shared/auth';

import { mfaEnrollmentRequestSchema } from '../../../../../../../specs/003-implement-secure-authentication/contracts/auth';

const DEFAULT_ISSUER = process.env.ADMIN_AUTH_MFA_ISSUER ?? 'FX Option Admin';

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

  const payload = mfaEnrollmentRequestSchema.parse({
    ...(typeof body === 'object' && body ? body : {}),
    userId: session.user.id,
    issuer: (body as any)?.issuer ?? DEFAULT_ISSUER,
    label: (body as any)?.label ?? session.user.email ?? session.user.id,
  });

  const enrollment = ensureMfaEnrollment(payload);
  return NextResponse.json(enrollment);
}
