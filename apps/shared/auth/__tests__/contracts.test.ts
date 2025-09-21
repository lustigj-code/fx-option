import {
  jwtPayloadSchema,
  sessionClaimsSchema,
  mfaEnrollmentRequestSchema,
  mfaEnrollmentResponseSchema,
  mfaVerificationRequestSchema,
  mfaVerificationResponseSchema,
} from '../../../../specs/003-implement-secure-authentication/contracts/auth';

import { APP_ROLES } from '@shared/auth';

describe('auth contract schemas', () => {
  it('validates canonical JWT payloads and rejects malformed data', () => {
    const payload = {
      sub: 'user-123',
      name: 'Demo User',
      email: 'demo@fxportal.local',
      roles: [APP_ROLES[0]],
      mfaVerified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iss: 'emerald.fx',
      aud: 'portal-web',
    };

    expect(jwtPayloadSchema.parse(payload)).toMatchObject(payload);
    expect(() =>
      jwtPayloadSchema.parse({
        ...payload,
        email: 'invalid-email',
      }),
    ).toThrow(/email must be valid/);
    expect(() =>
      jwtPayloadSchema.parse({
        ...payload,
        roles: [],
      }),
    ).toThrow(/at least one role/);
  });

  it('enforces UUID session identifiers on session claims', () => {
    const valid = sessionClaimsSchema.parse({
      sub: 'user-123',
      name: 'Demo User',
      email: 'demo@fxportal.local',
      roles: ['treasury_manager'],
      mfaVerified: false,
      exp: Math.floor(Date.now() / 1000) + 600,
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
    });

    expect(valid.sessionId).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(() =>
      sessionClaimsSchema.parse({
        ...valid,
        sessionId: 'not-a-uuid',
      }),
    ).toThrow(/UUID/);
  });

  it('normalises MFA verification requests and rejects invalid codes', () => {
    const parsed = mfaVerificationRequestSchema.parse({
      userId: 'user-456',
      code: '123 456',
      method: 'totp',
    });

    expect(parsed.code).toBe('123456');

    const invalid = mfaVerificationRequestSchema.safeParse({
      userId: 'user-789',
      code: '12-34',
      method: 'totp',
    });
    expect(invalid.success).toBe(false);
  });

  it('requires issuer metadata when enrolling MFA and produces secret payloads', () => {
    const enroll = mfaEnrollmentRequestSchema.parse({
      userId: 'user-999',
      issuer: 'Emerald FX',
      label: 'admin@fxportal.local',
    });

    expect(enroll.method).toBe('totp');

    const response = mfaEnrollmentResponseSchema.parse({
      secret: 'JBSWY3DPEHPK3PXP',
      uri: 'otpauth://totp/Emerald?secret=JBSWY3DPEHPK3PXP',
      recoveryCodes: ['code-one1', 'code-two2', 'code-thr3', 'code-four4'],
    });

    expect(response.recoveryCodes).toHaveLength(4);

    const insufficientCodes = mfaEnrollmentResponseSchema.safeParse({
      secret: 'JBSWY3DPEHPK3PXP',
      uri: 'otpauth://totp/Emerald?secret=JBSWY3DPEHPK3PXP',
      recoveryCodes: ['code-one1'],
    });

    expect(insufficientCodes.success).toBe(false);
  });

  it('exposes verification response schema for downstream typing', () => {
    const response = mfaVerificationResponseSchema.parse({
      verified: true,
      mfaVerifiedAt: new Date().toISOString(),
    });

    expect(response.verified).toBe(true);
  });
});
