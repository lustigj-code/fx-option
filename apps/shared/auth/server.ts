import { promises as fs } from 'fs';
import path from 'path';

import { normalizeRoles, type AppRole } from './index';

type AuthEnvPrefix = 'PORTAL' | 'ADMIN';

interface LockoutState {
  attempts: number;
  firstFailure: number;
  lockedUntil: number | null;
}

interface LockoutConfig {
  threshold: number;
  windowMs: number;
  durationMs: number;
}

const DEFAULT_THRESHOLD = 5;
const DEFAULT_WINDOW_SECONDS = 900;
const DEFAULT_DURATION_SECONDS = 900;

const failureMap = new Map<string, LockoutState>();

export interface SeedUserRecord {
  id: string;
  email: string;
  name: string;
  password: string;
  roles: AppRole[];
  mfaVerified: boolean;
}

export interface AuthenticatedSeedUser extends Omit<SeedUserRecord, 'password'> {}

const seedCache = new Map<string, SeedUserRecord[] | null>();

const now = () => Date.now();

const toKey = (email: string, prefix?: AuthEnvPrefix) => `${prefix ?? 'GLOBAL'}:${email}`;

const parseInteger = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const resolveLockoutConfig = (prefix?: AuthEnvPrefix): LockoutConfig => {
  const threshold = parseInteger(
    prefix ? process.env[`${prefix}_AUTH_FAILED_ATTEMPT_THRESHOLD`] : undefined,
    parseInteger(process.env.AUTH_FAILED_ATTEMPT_THRESHOLD, DEFAULT_THRESHOLD),
  );
  const windowSeconds = parseInteger(
    prefix ? process.env[`${prefix}_AUTH_FAILED_ATTEMPT_WINDOW_SECONDS`] : undefined,
    parseInteger(process.env.AUTH_FAILED_ATTEMPT_WINDOW_SECONDS, DEFAULT_WINDOW_SECONDS),
  );
  const durationSeconds = parseInteger(
    prefix ? process.env[`${prefix}_AUTH_LOCKOUT_DURATION_SECONDS`] : undefined,
    parseInteger(process.env.AUTH_LOCKOUT_DURATION_SECONDS, DEFAULT_DURATION_SECONDS),
  );

  return {
    threshold,
    windowMs: windowSeconds * 1000,
    durationMs: durationSeconds * 1000,
  };
};

export class AccountLockedError extends Error {
  until: Date;

  constructor(until: Date) {
    super('ACCOUNT_LOCKED');
    this.name = 'AccountLockedError';
    this.until = until;
  }
}

export const resetLockoutTracking = () => {
  failureMap.clear();
};

export const assertLoginAllowed = (email: string, prefix?: AuthEnvPrefix): void => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return;
  }

  const key = toKey(normalized, prefix);
  const state = failureMap.get(key);
  if (!state) {
    return;
  }

  const current = now();
  if (state.lockedUntil && state.lockedUntil > current) {
    throw new AccountLockedError(new Date(state.lockedUntil));
  }

  if (state.lockedUntil && state.lockedUntil <= current) {
    failureMap.delete(key);
    return;
  }

  const config = resolveLockoutConfig(prefix);
  if (current - state.firstFailure > config.windowMs) {
    failureMap.delete(key);
  }
};

export const recordLoginFailure = (email: string, prefix?: AuthEnvPrefix): void => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return;
  }

  const key = toKey(normalized, prefix);
  const config = resolveLockoutConfig(prefix);
  const current = now();
  const state = failureMap.get(key);

  if (!state) {
    failureMap.set(key, { attempts: 1, firstFailure: current, lockedUntil: null });
    return;
  }

  if (state.lockedUntil && state.lockedUntil > current) {
    return;
  }

  if (current - state.firstFailure > config.windowMs) {
    failureMap.set(key, { attempts: 1, firstFailure: current, lockedUntil: null });
    return;
  }

  const attempts = state.attempts + 1;
  if (attempts >= config.threshold) {
    const lockedUntil = current + config.durationMs;
    failureMap.set(key, { attempts: 0, firstFailure: lockedUntil, lockedUntil });
    return;
  }

  failureMap.set(key, { attempts, firstFailure: state.firstFailure, lockedUntil: null });
};

export const clearLoginFailures = (email: string, prefix?: AuthEnvPrefix): void => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return;
  }
  const key = toKey(normalized, prefix);
  failureMap.delete(key);
};

const resolveSeedPath = (seedFile?: string): string | null => {
  const configured = seedFile ?? process.env.PORTAL_AUTH_ROLE_SEED_FILE ?? null;
  if (!configured) {
    return null;
  }
  return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
};

const canonicaliseUser = (entry: any, fallbackId: string): SeedUserRecord | null => {
  if (typeof entry !== 'object' || entry === null) {
    return null;
  }

  const email = typeof entry.email === 'string' ? entry.email.trim().toLowerCase() : fallbackId;
  const name = typeof entry.name === 'string' && entry.name.trim().length > 0 ? entry.name.trim() : email.split('@')[0] ?? email;
  const password = typeof entry.password === 'string' ? entry.password : '';
  const roles = normalizeRoles(entry.roles ?? []);
  const mfaVerified = Boolean(entry.mfaVerified);

  if (!email || !password) {
    return null;
  }

  return {
    id: typeof entry.id === 'string' && entry.id ? entry.id : email,
    email,
    name,
    password,
    roles,
    mfaVerified,
  };
};

const loadSeedUsers = async (seedFile?: string): Promise<SeedUserRecord[]> => {
  const resolvedPath = resolveSeedPath(seedFile);
  if (!resolvedPath) {
    return [];
  }

  if (seedCache.has(resolvedPath)) {
    return seedCache.get(resolvedPath) ?? [];
  }

  try {
    const fileContents = await fs.readFile(resolvedPath, 'utf-8');
    const parsed = JSON.parse(fileContents);
    if (!Array.isArray(parsed)) {
      seedCache.set(resolvedPath, []);
      return [];
    }

    const users = parsed
      .map((entry, index) => canonicaliseUser(entry, `seed-${index}`))
      .filter((candidate): candidate is SeedUserRecord => candidate !== null);

    seedCache.set(resolvedPath, users);
    return users;
  } catch (error) {
    console.warn('[auth] unable to read seed file', resolvedPath, error);
    seedCache.set(resolvedPath, []);
    return [];
  }
};

const envSeedUser = (prefix: string): SeedUserRecord | null => {
  const username = process.env[`${prefix}_DEMO_USERNAME`];
  const password = process.env[`${prefix}_DEMO_PASSWORD`];
  if (!username || !password) {
    return null;
  }

  const email = username.trim().toLowerCase();
  return {
    id: email,
    email,
    name: username.split('@')[0] ?? email,
    password,
    roles: normalizeRoles([prefix === 'ADMIN' ? 'admin' : 'treasury_manager']),
    mfaVerified: prefix === 'ADMIN',
  };
};

export interface CredentialLookupOptions {
  email: string;
  password: string;
  seedFile?: string;
  envPrefix?: AuthEnvPrefix;
}

export const authenticateSeedUser = async ({
  email,
  password,
  seedFile,
  envPrefix,
}: CredentialLookupOptions): Promise<AuthenticatedSeedUser | null> => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return null;
  }

  const users = await loadSeedUsers(seedFile);
  const candidate = users.find((user) => user.email === normalizedEmail && user.password === password);
  if (candidate) {
    const { password: _ignored, ...userWithoutPassword } = candidate;
    return userWithoutPassword;
  }

  if (envPrefix) {
    const fallback = envSeedUser(envPrefix);
    if (fallback && fallback.email === normalizedEmail && fallback.password === password) {
      const { password: _ignored, ...userWithoutPassword } = fallback;
      return userWithoutPassword;
    }
  }

  return null;
};

export const getSeedUsers = async (seedFile?: string): Promise<AuthenticatedSeedUser[]> => {
  const users = await loadSeedUsers(seedFile);
  return users.map(({ password: _ignored, ...user }) => user);
};
