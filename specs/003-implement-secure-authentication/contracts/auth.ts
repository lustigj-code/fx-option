import { z, type Infer } from './zod-lite';

export const roleEnum = z.enum([
  'treasury_manager',
  'risk_analyst',
  'compliance_officer',
  'admin',
]);

export const jwtPayloadSchema = z.object({
  sub: z.string().min(1, 'sub is required'),
  name: z.string().min(1, 'name is required'),
  email: z.string().email('email must be valid'),
  roles: z.array(roleEnum).nonempty('at least one role is required'),
  mfaVerified: z.boolean(),
  exp: z.number().int().positive('exp must be a positive integer'),
  iat: z.number().int().positive().optional(),
  iss: z.string().optional(),
  aud: z.string().optional(),
});

export const sessionClaimsSchema = jwtPayloadSchema.extend({
  sessionId: z.string().uuid('sessionId must be a UUID'),
});

export const mfaMethodEnum = z.enum(['totp']);

export const mfaEnrollmentRequestSchema = z.object({
  userId: z.string().min(1),
  method: mfaMethodEnum.default('totp'),
  issuer: z.string().min(1),
  label: z.string().min(1),
});

export const mfaEnrollmentResponseSchema = z.object({
  secret: z.string().min(16),
  uri: z.string().url(),
  recoveryCodes: z.array(z.string().min(8)).min(4),
});

const sanitizeOtp = (value: string) => value.replace(/[^0-9]/g, '');

export const mfaVerificationRequestSchema = z
  .object({
    userId: z.string().min(1),
    method: mfaMethodEnum.default('totp'),
    code: z
      .string()
      .min(6)
      .max(12)
      .transform(sanitizeOtp)
      .refine((value) => /^[0-9]{6}$/.test(value), {
        message: 'code must contain 6 digits',
      }),
    sessionId: z.string().uuid().optional(),
  })
  .transform((payload) => ({
    ...payload,
    code: sanitizeOtp(payload.code),
  }));

export const mfaVerificationResponseSchema = z.object({
  verified: z.boolean(),
  mfaVerifiedAt: z.string().datetime().optional(),
  recoveryCodesConsumed: z.boolean().optional(),
});

export type JwtPayload = Infer<typeof jwtPayloadSchema>;
export type SessionClaims = Infer<typeof sessionClaimsSchema>;
export type MfaEnrollmentRequest = Infer<typeof mfaEnrollmentRequestSchema>;
export type MfaEnrollmentResponse = Infer<typeof mfaEnrollmentResponseSchema>;
export type MfaVerificationRequest = Infer<typeof mfaVerificationRequestSchema>;
export type MfaVerificationResponse = Infer<typeof mfaVerificationResponseSchema>;
