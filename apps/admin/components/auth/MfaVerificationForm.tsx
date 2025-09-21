'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { MfaPrompt } from '@/components/auth/MfaPrompt';

interface MfaVerificationFormProps {
  verifyEndpoint?: string;
  supportEmail?: string;
  callbackUrl?: string;
}

const DEFAULT_ERROR = 'Unable to verify the provided code. Please try again.';

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = await response.json();
    if (payload && typeof payload.error === 'string') {
      return payload.error;
    }
  } catch (error) {
    console.warn('Failed to parse MFA error payload', error);
  }
  return DEFAULT_ERROR;
};

export function MfaVerificationForm({
  verifyEndpoint,
  supportEmail,
  callbackUrl = '/',
}: MfaVerificationFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (code: string) => {
    if (pending) {
      return;
    }

    if (!verifyEndpoint) {
      setError('MFA verification endpoint is not configured. Contact support.');
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch(verifyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        setError(await parseErrorMessage(response));
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (submitError) {
      console.error('MFA verification failed', submitError);
      setError(DEFAULT_ERROR);
    } finally {
      setPending(false);
    }
  };

  return (
    <MfaPrompt
      onSubmit={handleSubmit}
      pending={pending}
      error={error ?? undefined}
      supportEmail={supportEmail}
      onUseRecoveryCode={() =>
        setError('Recovery codes are not yet available in this environment. Contact support for assistance.')
      }
    />
  );
}

export default MfaVerificationForm;
