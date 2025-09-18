import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_COOKIE = 'admin_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 8; // 8 hours
const ALGORITHM = 'sha256';

const secret = process.env.ADMIN_SECRET ?? 'change-me-in-production';

interface SessionPayload {
  username: string;
  exp: number;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString();
}

function sign(payload: string) {
  return createHmac(ALGORITHM, secret).update(payload).digest('base64url');
}

export function createSessionToken(username: string) {
  const payload: SessionPayload = {
    username,
    exp: Date.now() + SESSION_DURATION_MS
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) {
    return null;
  }
  const expected = sign(body);
  const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) {
    return null;
  }
  try {
    const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload;
    if (payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_MS / 1000
  };
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
