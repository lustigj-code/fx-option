import type { NextAuthOptions, RequestInternal } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';

import { isMfaVerified, sessionRequiresMfa, withNormalizedRoles, type AppRole } from '@shared/auth';
import {
  AccountLockedError,
  assertLoginAllowed,
  authenticateSeedUser,
  clearLoginFailures,
  recordLoginFailure,
} from '@shared/auth/server';
import { emitLoginFailure, emitLoginSuccess, emitLogout } from '@shared/auth/audit';

const SESSION_MAX_AGE = Number.parseInt(
  process.env.ADMIN_SESSION_MAX_AGE ?? process.env.SESSION_MAX_AGE ?? '28800',
  10,
);

const resolveClientIp = (req: RequestInternal | undefined): string | null => {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? null;
  }
  const realIp = req?.headers?.['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp.trim();
  }
  return null;
};

const resolveUserAgent = (req: RequestInternal | undefined): string | null => {
  const ua = req?.headers?.['user-agent'];
  return typeof ua === 'string' ? ua : null;
};

const ADMIN_PRIVILEGED_ROLES: AppRole[] = ['compliance_officer', 'admin'];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials, req) => {
        const email = credentials?.email?.toLowerCase().trim() ?? '';
        const password = credentials?.password ?? '';
        const ipAddress = resolveClientIp(req);
        const userAgent = resolveUserAgent(req);

        if (!email || !password) {
          if (email) {
            recordLoginFailure(email, 'ADMIN');
          }
          await emitLoginFailure({
            userId: email || 'unknown',
            email: email || null,
            roles: [],
            ip: ipAddress,
            userAgent,
            metadata: { failureReason: 'MISSING_CREDENTIALS' },
          });
          return null;
        }

        try {
          assertLoginAllowed(email, 'ADMIN');
        } catch (error) {
          if (error instanceof AccountLockedError) {
            await emitLoginFailure({
              userId: email,
              email,
              roles: [],
              ip: ipAddress,
              userAgent,
              metadata: {
                failureReason: 'ACCOUNT_LOCKED',
                unlockAt: error.until.toISOString(),
              },
            });
            throw new Error('AccountLocked');
          }
          throw error;
        }

        const authenticated = await authenticateSeedUser({
          email,
          password,
          seedFile: process.env.ADMIN_AUTH_ROLE_SEED_FILE,
          envPrefix: 'ADMIN',
        });

        if (!authenticated) {
          recordLoginFailure(email, 'ADMIN');
          await emitLoginFailure({
            userId: email,
            email,
            roles: [],
            ip: ipAddress,
            userAgent,
            metadata: { failureReason: 'INVALID_CREDENTIALS' },
          });
          return null;
        }

        clearLoginFailures(email, 'ADMIN');
        return {
          id: authenticated.id,
          name: authenticated.name,
          email: authenticated.email,
          roles: [...authenticated.roles],
          mfaVerified: authenticated.mfaVerified,
          ipAddress,
          userAgent,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: Number.isFinite(SESSION_MAX_AGE) ? SESSION_MAX_AGE : 28800,
  },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.userId = (user as any).id ?? token.sub ?? '';
        token.roles = Array.isArray((user as any).roles) ? ((user as any).roles as AppRole[]) : [];
        token.mfaVerified = Boolean((user as any).mfaVerified);
        token.ip = (user as any).ipAddress ?? null;
        token.userAgent = (user as any).userAgent ?? null;
      }
      if (typeof token.userId === 'string' && token.userId) {
        if (!token.mfaVerified && isMfaVerified(token.userId)) {
          token.mfaVerified = true;
        }
      }
      return token;
    },
    async session({ session, token }) {
      const normalized = withNormalizedRoles({
        user: {
          id: (token.userId as string) ?? '',
          email: session.user?.email ?? (token.email as string) ?? '',
          name: session.user?.name ?? (token.name as string) ?? null,
          roles: Array.isArray(token.roles) ? (token.roles as AppRole[]) : [],
          mfaVerified: Boolean(token.mfaVerified),
        },
      });

      session.user = normalized.user;
      (session as any).requiresMfa = sessionRequiresMfa({ user: normalized.user });
      return session;
    },
    async signIn({ user }) {
      clearLoginFailures((user as any).email ?? user.email ?? 'unknown', 'ADMIN');
      await emitLoginSuccess({
        userId: (user as any).id ?? user.email ?? 'unknown',
        email: user.email,
        roles: Array.isArray((user as any).roles) ? ((user as any).roles as AppRole[]) : [],
        ip: (user as any).ipAddress ?? null,
        userAgent: (user as any).userAgent ?? null,
      });
      return true;
    },
  },
  events: {
    async signOut({ token }) {
      if (!token) {
        return;
      }
      await emitLogout({
        userId: (token.userId as string) ?? (token.sub as string) ?? 'unknown',
        email: (token.email as string) ?? null,
        roles: Array.isArray(token.roles) ? (token.roles as AppRole[]) : [],
        ip: (token.ip as string) ?? null,
        userAgent: (token.userAgent as string) ?? null,
      });
    },
  },
};

export const privilegedRoles = ADMIN_PRIVILEGED_ROLES;
