import {
  mfaEnrollmentRequestSchema,
  mfaEnrollmentResponseSchema,
  mfaVerificationRequestSchema,
  mfaVerificationResponseSchema,
  roleSchema,
  sessionJwtSchema,
} from '../../../specs/003-implement-secure-authentication/contracts/auth';

describe('auth contracts', () => {
  const baseJwt = {
    sub: 'user-123',
    name: 'Demo User',
    email: 'demo@fxportal.local',
    roles: ['treasury_manager'] as const,
    mfaVerified: true,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  it('accepts well-formed session JWT payloads', () => {
    expect(sessionJwtSchema.parse(baseJwt)).toMatchObject({
      sub: 'user-123',
      roles: ['treasury_manager'],
    });
  });

  it('limits roles to the enumerated set', () => {
    expect(roleSchema.safeParse('admin').success).toBe(true);
    expect(roleSchema.safeParse('operator').success).toBe(false);
  });

  it('rejects payloads without role claims', () => {
    const result = sessionJwtSchema.safeParse({
      ...baseJwt,
      roles: [],
    });

    expect(result.success).toBe(false);
  });

  it('validates MFA enrollment inputs', () => {
    const request = {
      userId: 'user-123',
      method: 'totp',
      issuer: 'FX Option',
      label: 'Demo User',
    } as const;

    expect(mfaEnrollmentRequestSchema.parse(request)).toEqual(request);

    const invalidMethod = mfaEnrollmentRequestSchema.safeParse({
      ...request,
      method: 'sms',
    });

    expect(invalidMethod.success).toBe(false);
  });

  it('returns enrollment response with backup codes and metadata', () => {
    const response = mfaEnrollmentResponseSchema.parse({
      otpauthUrl: 'otpauth://totp/FX%20Option:demo?secret=ABC',
      secret: 'ABCDEF123456',
      backupCodes: ['111111', '222222', '333333', '444444'],
      expiresAt: Math.floor(Date.now() / 1000) + 600,
    });

    expect(response.backupCodes).toHaveLength(4);
  });

  it('validates verification attempts and default next step', () => {
    const verification = mfaVerificationRequestSchema.parse({
      userId: 'user-123',
      code: '123456',
      rememberDevice: true,
    });

    expect(verification.code).toBe('123456');

    const response = mfaVerificationResponseSchema.parse({
      verified: true,
      mfaVerified: true,
    });

    expect(response.nextStep).toBe('completed');

    const invalidCode = mfaVerificationRequestSchema.safeParse({
      userId: 'user-123',
      code: '12-456',
    });

    expect(invalidCode.success).toBe(false);
  });
});
