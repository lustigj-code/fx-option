import type { DefaultSession, DefaultUser } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';
import type { Role } from '@shared/auth';

declare module 'next-auth' {
  interface Session {
    user: (DefaultSession['user'] & {
      id: string;
      roles: Role[];
      mfaVerified: boolean;
    }) | null;
    sessionId: string;
  }

  interface User extends DefaultUser {
    roles?: Role[];
    mfaVerified?: boolean;
    auditContext?: {
      ip?: string;
      userAgent?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId?: string;
    roles?: Role[];
    mfaVerified?: boolean;
    sessionId?: string;
  }
}
