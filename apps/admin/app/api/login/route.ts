import { NextResponse } from 'next/server';

import { createSessionToken, sessionCookieOptions } from '@/lib/auth';

const ADMIN_USER = process.env.ADMIN_USER ?? 'operator';
const ADMIN_PASS = process.env.ADMIN_PASS ?? 'trader!123';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return NextResponse.json({ error: 'Incorrect credentials' }, { status: 401 });
  }

  const token = createSessionToken(username);
  const cookie = sessionCookieOptions();

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: cookie.name,
    value: token,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    secure: cookie.secure,
    path: cookie.path,
    maxAge: cookie.maxAge
  });

  return response;
}
