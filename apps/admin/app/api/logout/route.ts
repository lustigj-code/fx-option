import { NextResponse } from 'next/server';

import { sessionCookieOptions } from '@/lib/auth';

export async function POST() {
  const cookie = sessionCookieOptions();
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: cookie.name,
    value: '',
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    secure: cookie.secure,
    path: cookie.path,
    maxAge: 0
  });
  return response;
}
