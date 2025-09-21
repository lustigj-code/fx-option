import fs from 'node:fs';
import path from 'node:path';

import { ensureRoles, Role } from '@shared/auth';

interface DemoUser {
  id: string;
  email: string;
  password: string;
  roles: Role[];
  name?: string;
  mfaVerified?: boolean;
}

const cachedUsers: DemoUser[] = [];
let hydrated = false;

const normalizeRoles = (value: string | string[] | undefined): Role[] => {
  if (!value) {
    return [];
  }
  const list = Array.isArray(value) ? value : value.split(',');
  return ensureRoles(list.map((entry) => entry.trim()).filter(Boolean));
};

const readSeedUsers = (seedPath: string): DemoUser[] => {
  try {
    const absolute = path.isAbsolute(seedPath) ? seedPath : path.join(process.cwd(), seedPath);
    const raw = fs.readFileSync(absolute, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((entry) => ({
        id: entry.id ?? entry.email,
        email: entry.email,
        password: entry.password,
        roles: ensureRoles(entry.roles ?? []),
        name: entry.name,
        mfaVerified: Boolean(entry.mfaVerified ?? entry.mfa_verified),
      }))
      .filter((user) => Boolean(user.email) && Boolean(user.password));
  } catch (error) {
    return [];
  }
};

const seedFromEnv = (): DemoUser[] => {
  const email = process.env.ADMIN_DEMO_USERNAME;
  const password = process.env.ADMIN_DEMO_PASSWORD;
  const roles = normalizeRoles(process.env.ADMIN_DEMO_ROLES);
  if (!email || !password) {
    return [];
  }
  return [
    {
      id: email,
      email,
      password,
      roles: roles.length > 0 ? roles : ['compliance_officer'],
      name: email.split('@')[0] ?? email,
      mfaVerified: true,
    },
  ];
};

const hydrate = () => {
  if (hydrated) {
    return;
  }
  hydrated = true;
  const users = [] as DemoUser[];
  const seedPath = process.env.ADMIN_ROLE_SEED_PATH;
  if (seedPath) {
    users.push(...readSeedUsers(seedPath));
  }
  if (users.length === 0) {
    users.push(...seedFromEnv());
  }
  const deduped = new Map<string, DemoUser>();
  for (const user of users) {
    if (!user.email || !user.password) {
      continue;
    }
    deduped.set(user.email.toLowerCase(), user);
  }
  cachedUsers.splice(0, cachedUsers.length, ...deduped.values());
};

export const listDemoUsers = (): DemoUser[] => {
  hydrate();
  return [...cachedUsers];
};

export const findDemoUser = (email: string): DemoUser | undefined => {
  hydrate();
  return cachedUsers.find((user) => user.email.toLowerCase() === email.toLowerCase());
};

export type { DemoUser };
