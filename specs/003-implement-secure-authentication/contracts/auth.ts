import { z } from 'zod';

export const roleSchema = z.enum([
  'treasury_manager',
  'risk_analyst',
  'compliance_officer',
  'admin',
] as const);

export const sessionJwtSchema = z
  .object({
    sub: z.string().min(1, 'subject is required'),
    name: z.string().min(1, 'name is required'),
    email: z.string().email('valid email required'),
    roles: z.array(roleSchema).min(1, 'at least one role required'),
    mfaVerified: z.boolean(),
    exp: z.number().int().positive(),
    iat: z.number().int().optional(),
    sessionId: z.string().min(1).optional(),
    aud: z.string().min(1).optional(),
    iss: z.string().min(1).optional(),
  })
  .strict();

export const mfaEnrollmentRequestSchema = z
  .object({
    userId: z.string().min(1),
    method: z.literal('totp'),
    issuer: z.string().min(1),
    label: z.string().min(1),
    locale: z.string().optional(),
  })
  .strict();

export const mfaEnrollmentResponseSchema = z
  .object({
    otpauthUrl: z.string().min(1),
    secret: z.string().min(1),
    backupCodes: z.array(z.string().min(6)).min(4),
    expiresAt: z.number().int().positive().optional(),
  })
  .strict();

export const mfaVerificationRequestSchema = z
  .object({
    userId: z.string().min(1),
    code: z.string().regex(/^[0-9]{6}$/),
    deviceName: z.string().min(1).optional(),
    rememberDevice: z.boolean().optional(),
  })
  .strict();

export const mfaVerificationResponseSchema = z
  .object({
    verified: z.boolean(),
    mfaVerified: z.boolean(),
    recoveryCodesRemaining: z.number().int().nonnegative().optional(),
    nextStep: z.enum(['completed', 'challenge-secondary']).default('completed'),
  })
  .strict();

export type Role = z.infer<typeof roleSchema>;
export type SessionJwt = z.infer<typeof sessionJwtSchema>;
export type MfaEnrollmentRequest = z.infer<typeof mfaEnrollmentRequestSchema>;
export type MfaEnrollmentResponse = z.infer<typeof mfaEnrollmentResponseSchema>;
export type MfaVerificationRequest = z.infer<typeof mfaVerificationRequestSchema>;
export type MfaVerificationResponse = z.infer<typeof mfaVerificationResponseSchema>;
