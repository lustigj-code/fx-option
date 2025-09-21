import crypto from 'crypto';

export type MfaMethod = 'totp';

interface EnrollmentRecord {
  userId: string;
  method: MfaMethod;
  secret: Buffer;
  secretBase32: string;
  issuer: string;
  label: string;
  recoveryCodes: Array<{ code: string; used: boolean }>;
  createdAt: string;
  verifiedAt?: string;
}

export interface EnrollmentPayload {
  userId: string;
  method?: MfaMethod;
  issuer: string;
  label: string;
}

export interface VerificationPayload {
  userId: string;
  method?: MfaMethod;
  code: string;
}

export interface EnrollmentResponse {
  secret: string;
  uri: string;
  recoveryCodes: string[];
}

export interface VerificationResponse {
  verified: boolean;
  mfaVerifiedAt?: string;
  recoveryCodesConsumed?: boolean;
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_STEP_SECONDS = 30;
const RECOVERY_CODE_LENGTH = 10;
const RECOVERY_CODE_COUNT = 8;

const enrollmentStore = new Map<string, EnrollmentRecord>();

const toBase32 = (buffer: Buffer): string => {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      const index = (value >>> (bits - 5)) & 31;
      output += BASE32_ALPHABET[index];
      bits -= 5;
    }
  }

  if (bits > 0) {
    const index = (value << (5 - bits)) & 31;
    output += BASE32_ALPHABET[index];
  }

  return output;
};

const generateSecret = (size = 20): Buffer => crypto.randomBytes(size);

const generateRecoveryCode = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const randomBytes = crypto.randomBytes(RECOVERY_CODE_LENGTH);

  for (const byte of randomBytes) {
    result += alphabet[byte % alphabet.length];
    if (result.length === RECOVERY_CODE_LENGTH) {
      break;
    }
  }

  return result;
};

const generateRecoveryCodes = (): Array<{ code: string; used: boolean }> =>
  Array.from({ length: RECOVERY_CODE_COUNT }, () => ({ code: generateRecoveryCode(), used: false }));

const createEnrollmentRecord = ({
  userId,
  method = 'totp',
  issuer,
  label,
}: EnrollmentPayload): EnrollmentRecord => {
  const secret = generateSecret();
  const secretBase32 = toBase32(secret);

  return {
    userId,
    method,
    secret,
    secretBase32,
    issuer,
    label,
    recoveryCodes: generateRecoveryCodes(),
    createdAt: new Date().toISOString(),
  };
};

const buildOtpAuthUri = (record: EnrollmentRecord): string => {
  const label = encodeURIComponent(record.label);
  const issuer = encodeURIComponent(record.issuer);
  return `otpauth://totp/${label}?secret=${record.secretBase32}&issuer=${issuer}`;
};

const totpCounter = (time: number): number => Math.floor(time / 1000 / TOTP_STEP_SECONDS);

const generateTotp = (secret: Buffer, counter: number): string => {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = crypto.createHmac('sha1', secret).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;

  return code.toString().padStart(6, '0');
};

const verifyTotpCode = (secret: Buffer, code: string, window = 1): boolean => {
  const currentCounter = totpCounter(Date.now());
  for (let offset = -window; offset <= window; offset += 1) {
    const counter = currentCounter + offset;
    if (counter < 0) {
      // eslint-disable-next-line no-continue
      continue;
    }
    if (generateTotp(secret, counter) === code) {
      return true;
    }
  }
  return false;
};

export const ensureMfaEnrollment = ({
  userId,
  method = 'totp',
  issuer,
  label,
}: EnrollmentPayload): EnrollmentResponse => {
  const existing = enrollmentStore.get(userId);
  if (existing && existing.method === method) {
    return {
      secret: existing.secretBase32,
      uri: buildOtpAuthUri(existing),
      recoveryCodes: existing.recoveryCodes.map((entry) => entry.code),
    };
  }

  const record = createEnrollmentRecord({ userId, method, issuer, label });
  enrollmentStore.set(userId, record);

  return {
    secret: record.secretBase32,
    uri: buildOtpAuthUri(record),
    recoveryCodes: record.recoveryCodes.map((entry) => entry.code),
  };
};

export const verifyMfa = ({
  userId,
  method = 'totp',
  code,
}: VerificationPayload): VerificationResponse => {
  const record = enrollmentStore.get(userId);
  if (!record || record.method !== method) {
    return { verified: false };
  }

  const sanitized = code.replace(/\s+/g, '');
  const now = new Date().toISOString();

  const recovery = record.recoveryCodes.find((entry) => !entry.used && entry.code === sanitized);
  if (recovery) {
    recovery.used = true;
    record.verifiedAt = now;
    enrollmentStore.set(userId, record);
    return { verified: true, mfaVerifiedAt: now, recoveryCodesConsumed: true };
  }

  if (!verifyTotpCode(record.secret, sanitized)) {
    return { verified: false };
  }

  record.verifiedAt = now;
  enrollmentStore.set(userId, record);
  return { verified: true, mfaVerifiedAt: now, recoveryCodesConsumed: false };
};

export const isMfaVerified = (userId: string): boolean => {
  const record = enrollmentStore.get(userId);
  return Boolean(record?.verifiedAt);
};

export const getEnrollmentSummary = (userId: string): EnrollmentResponse | null => {
  const record = enrollmentStore.get(userId);
  if (!record) {
    return null;
  }
  return {
    secret: record.secretBase32,
    uri: buildOtpAuthUri(record),
    recoveryCodes: record.recoveryCodes.map((entry) => entry.code),
  };
};

export const resetMfaEnrollment = (userId: string): void => {
  enrollmentStore.delete(userId);
};
