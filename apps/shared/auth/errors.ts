const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: 'Invalid email or password. Check your credentials and try again.',
  AccessDenied: 'Access denied. Request access or contact support for assistance.',
  SessionRequired: 'Your session expired. Please sign in again to continue.',
  CallbackRouteError: 'Authentication could not be completed. Please retry.',
  Default: 'Unable to sign in. Please retry or contact support if the issue persists.',
};

export const mapAuthError = (code: string | null | undefined): string => {
  if (!code) {
    return '';
  }
  const normalized = code.replace(/\+/g, ' ');
  if (AUTH_ERROR_MESSAGES[normalized]) {
    return AUTH_ERROR_MESSAGES[normalized];
  }
  if (AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }
  return AUTH_ERROR_MESSAGES.Default;
};

export const hasAuthError = (code: string | null | undefined): boolean => {
  return !!code;
};
