interface AuthEvent {
  action: string;
  actor: string;
  payload: Record<string, unknown>;
}

const resolveEndpoint = () => {
  const explicit = process.env.PORTAL_AUDIT_ENDPOINT;
  if (explicit) {
    return explicit;
  }
  const base = process.env.PORTAL_AUDIT_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    return undefined;
  }
  try {
    const url = new URL(base);
    url.pathname = `${url.pathname.replace(/\/$/, '')}/audit/auth`;
    return url.toString();
  } catch (error) {
    return undefined;
  }
};

export const recordAuthEvent = async (event: AuthEvent): Promise<void> => {
  const endpoint = resolveEndpoint();
  if (!endpoint) {
    return;
  }
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error('Failed to record auth event', error);
  }
};

export type { AuthEvent };
