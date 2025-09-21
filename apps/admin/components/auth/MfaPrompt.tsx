'use client';

import * as React from 'react';

import { MfaPrompt as UiMfaPrompt } from 'ui-kit';

export interface MfaPromptProps {
  email?: string;
  supportEmail?: string;
  onVerify?: (code: string) => Promise<void> | void;
}

const DEFAULT_SUPPORT_EMAIL = 'security@fxportal.local';

export function MfaPrompt({
  email,
  supportEmail = DEFAULT_SUPPORT_EMAIL,
  onVerify,
}: Readonly<MfaPromptProps>) {
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = React.useCallback(
    async (code: string) => {
      setIsSubmitting(true);
      setError(null);

      try {
        if (onVerify) {
          await onVerify(code);
        }
      } catch (cause) {
        console.error('MFA verification failed', cause);
        const message =
          cause instanceof Error && typeof cause.message === 'string' && cause.message.trim().length > 0
            ? cause.message
            : 'Verification failed. Please try again.';
        setError(message);
        return;
      } finally {
        setIsSubmitting(false);
      }
    },
    [onVerify],
  );

  return (
    <UiMfaPrompt
      email={email}
      supportEmail={supportEmail}
      isSubmitting={isSubmitting}
      errorMessage={error}
      onSubmit={handleSubmit}
    />
  );
}
