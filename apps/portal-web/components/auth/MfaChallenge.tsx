'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { MfaPrompt } from '@/components/auth/MfaPrompt';

export interface PortalMfaChallengeProps {
  email?: string;
  supportEmail?: string;
  callbackUrl: string;
  verifyEndpoint?: string;
  onComplete?: () => void;
}

const DEFAULT_VERIFY_ENDPOINT = '/api/auth/mfa/verify';

export function MfaChallenge({
  email,
  supportEmail,
  callbackUrl,
  verifyEndpoint = DEFAULT_VERIFY_ENDPOINT,
  onComplete,
}: Readonly<PortalMfaChallengeProps>) {
  const router = useRouter();

  const handleVerify = React.useCallback(
    async (code: string) => {
      const response = await fetch(verifyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.verified) {
        const message =
          (payload && typeof payload.error === 'string' && payload.error.trim().length > 0)
            ? payload.error
            : 'Verification failed. Please try again.';
        throw new Error(message);
      }

      if (onComplete) {
        onComplete();
      }

      router.push(callbackUrl);
      router.refresh();
    },
    [callbackUrl, onComplete, router, verifyEndpoint],
  );

  return <MfaPrompt email={email} supportEmail={supportEmail} onVerify={handleVerify} />;
}
