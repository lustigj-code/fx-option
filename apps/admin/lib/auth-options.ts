import { randomUUID } from 'crypto';

import type { NextAuthOptions, RequestInternal } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { recordAdminAuthEvent } from '@/lib/audit';
import { findDemoUser } from '@/lib/auth/demo-users';
import type { Role } from '@shared/auth';

interface AuditContext {
  ip?: string;
  userAgent?: string;
}

interface AdminUser {
  id: string;
  email: string;
  name?: string | null;
  roles: Role[];
  mfaVerified: boolean;
  auditContext?: AuditContext;
}

const PRIVILEGED_ROLES: Role[] = ['compliance_officer', 'admin'];

const parseMaxAge = (): number => {
  const raw = process.env.ADMIN_SESSION_MAX_AGE_SECONDS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 60 * 30;
};

const extractContext = (req: Pick<RequestInternal, 'headers'> | undefined): AuditContext => {
  const headers = req?.headers ?? {};
  const forwarded = headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === 'string'
    ? forwarded.split(',')[0]?.trim()
    : headers['x-real-ip'];
  const userAgent = Array.isArray(headers['user-agent']) ? headers['user-agent'][0] : headers['user-agent'];
  return {
    ip: typeof ip === 'string' && ip.length > 0 ? ip : undefined,
    userAgent: typeof userAgent === 'string' ? userAgent : undefined,
  };
};

const loginFailure = async (email: string | undefined, reason: string, context: AuditContext) => {
  await recordAdminAuthEvent({
    action: 'AUTH_LOGIN_FAILURE',
    actor: email ?? 'unknown',
    payload: {
      eventType: 'LOGIN_FAILURE',
      user: { email },
      reason,
      context,
    },
  });
};

const loginSuccess = async (user: AdminUser, sessionId: string, context: AuditContext) => {
  await recordAdminAuthEvent({
    action: 'AUTH_LOGIN_SUCCESS',
    actor: user.id,
    payload: {
      eventType: 'LOGIN_SUCCESS',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
      session: {
        id: sessionId,
        mfaVerified: user.mfaVerified,
      },
      context,
    },
  });
};

const logoutEvent = async (token: Record<string, unknown>) => {
  const userId = typeof token.userId === 'string' ? token.userId : undefined;
  const sessionId = typeof token.sessionId === 'string' ? token.sessionId : undefined;
  if (!userId || !sessionId) {
    return;
  }
  await recordAdminAuthEvent({
    action: 'AUTH_LOGOUT',
    actor: userId,
    payload: {
      eventType: 'LOGOUT',
      session: {
        id: sessionId,
        mfaVerified: Boolean(token.mfaVerified),
      },
    },
  });
};

const parseRequireMfaRoles = (): Role[] => {
  const raw = process.env.ADMIN_REQUIRE_MFA_ROLES;
  if (!raw) {
    return PRIVILEGED_ROLES;
  }
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry): entry is Role => entry.length > 0);
};

const requireMfaFlag = process.env.ADMIN_REQUIRE_MFA !== 'false';
const requireMfaRoles = new Set<Role>(parseRequireMfaRoles());

const shouldRequireMfa = (roles: Role[], mfaVerified: boolean): boolean => {
  if (!requireMfaFlag) {
    return false;
  }
  const enforce = roles.some((role) => requireMfaRoles.has(role));
  return enforce && !mfaVerified;
};

const hasPrivilege = (roles: Role[]): boolean => roles.some((role) => PRIVILEGED_ROLES.includes(role));

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials, req) => {
        const email = credentials?.email;
        const password = credentials?.password;
        const context = extractContext(req);
        if (!email || !password) {
          await loginFailure(email, 'MISSING_CREDENTIALS', context);
          return null;
        }

        const demoUser = findDemoUser(email);
        if (!demoUser || demoUser.password !== password) {
          await loginFailure(email, 'INVALID_CREDENTIALS', context);
          return null;
        }

        if (!hasPrivilege(demoUser.roles)) {
          await loginFailure(email, 'INSUFFICIENT_ROLE', context);
          return null;
        }

        const adminUser: AdminUser = {
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name ?? demoUser.email.split('@')[0] ?? demoUser.email,
          roles: demoUser.roles,
          mfaVerified: Boolean(demoUser.mfaVerified),
          auditContext: context,
        };
        return adminUser as unknown as Record<string, unknown>;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: parseMaxAge(),
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const adminUser = user as unknown as AdminUser;
        const sessionId = randomUUID();
        token.userId = adminUser.id;
        token.email = adminUser.email;
        token.name = adminUser.name;
        token.roles = adminUser.roles;
        token.mfaVerified = adminUser.mfaVerified;
        token.sessionId = sessionId;
        token.mfaRequired = shouldRequireMfa(adminUser.roles, adminUser.mfaVerified);
        await loginSuccess(adminUser, sessionId, adminUser.auditContext ?? {});
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) ?? '';
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.roles = (token.roles as Role[]) ?? [];
        session.user.mfaVerified = Boolean(token.mfaVerified);
        session.user.mfaRequired = Boolean(token.mfaRequired);
      }
      session.sessionId = (token.sessionId as string) ?? '';
      return session;
    },
    async signIn({ user }) {
      const adminUser = user as unknown as AdminUser | undefined;
      if (!adminUser) {
        return false;
      }
      return true;
    },
  },
  events: {
    async signOut({ token }) {
      if (token) {
        await logoutEvent(token as Record<string, unknown>);
      }
    },
  },
};
