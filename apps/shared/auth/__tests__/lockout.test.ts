import {
  AccountLockedError,
  assertLoginAllowed,
  clearLoginFailures,
  recordLoginFailure,
  resetLockoutTracking,
} from '@shared/auth/server';

const originalThreshold = process.env.AUTH_FAILED_ATTEMPT_THRESHOLD;
const originalWindow = process.env.AUTH_FAILED_ATTEMPT_WINDOW_SECONDS;
const originalDuration = process.env.AUTH_LOCKOUT_DURATION_SECONDS;

describe('shared auth lockout policy', () => {
  beforeEach(() => {
    resetLockoutTracking();
    process.env.AUTH_FAILED_ATTEMPT_THRESHOLD = '3';
    process.env.AUTH_FAILED_ATTEMPT_WINDOW_SECONDS = '60';
    process.env.AUTH_LOCKOUT_DURATION_SECONDS = '60';
  });

  afterEach(() => {
    resetLockoutTracking();
    if (originalThreshold === undefined) {
      delete process.env.AUTH_FAILED_ATTEMPT_THRESHOLD;
    } else {
      process.env.AUTH_FAILED_ATTEMPT_THRESHOLD = originalThreshold;
    }
    if (originalWindow === undefined) {
      delete process.env.AUTH_FAILED_ATTEMPT_WINDOW_SECONDS;
    } else {
      process.env.AUTH_FAILED_ATTEMPT_WINDOW_SECONDS = originalWindow;
    }
    if (originalDuration === undefined) {
      delete process.env.AUTH_LOCKOUT_DURATION_SECONDS;
    } else {
      process.env.AUTH_LOCKOUT_DURATION_SECONDS = originalDuration;
    }
  });

  it('throws AccountLockedError after exceeding threshold', () => {
    const email = 'user@example.com';

    expect(() => assertLoginAllowed(email)).not.toThrow();

    recordLoginFailure(email);
    recordLoginFailure(email);
    recordLoginFailure(email);

    expect(() => assertLoginAllowed(email)).toThrow(AccountLockedError);
  });

  it('clears failure counts after successful authentication', () => {
    const email = 'demo@example.com';

    recordLoginFailure(email);
    recordLoginFailure(email);

    clearLoginFailures(email);

    expect(() => assertLoginAllowed(email)).not.toThrow();
  });
});
