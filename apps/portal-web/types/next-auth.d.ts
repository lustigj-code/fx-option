import { type AppRole } from '@shared/auth';
import NextAuth, { type DefaultSession } from 'next-auth';
import { type JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      roles: AppRole[];
      mfaVerified: boolean;
    };
    requiresMfa?: boolean;
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    roles: AppRole[];
    mfaVerified: boolean;
    ipAddress?: string | null;
    userAgent?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    roles?: AppRole[];
    mfaVerified?: boolean;
    ip?: string | null;
    userAgent?: string | null;
  }
}
