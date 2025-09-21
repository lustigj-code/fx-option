'use client';

import * as React from 'react';
import { useSyncExternalStore } from 'react';
import { signIn } from 'next-auth/react';

import { createLoginController, type LoginControllerState } from '@shared/auth';
import { LoginCard } from 'ui-kit';

export interface AdminLoginFormProps {
  onSuccess?: (redirectUrl: string) => void;
  supportEmail?: string;
  callbackUrl?: string;
}

const DEFAULT_SUPPORT_EMAIL = 'security@fxportal.local';

export function LoginForm({
  onSuccess,
  supportEmail = DEFAULT_SUPPORT_EMAIL,
  callbackUrl = '/',
}: Readonly<AdminLoginFormProps>) {
  const controller = React.useMemo(() => {
    return createLoginController({
      callbackUrl,
      signIn,
      onSuccess: (destination) => {
        if (onSuccess) {
          onSuccess(destination);
        } else if (typeof window !== 'undefined' && destination) {
          window.location.href = destination;
        }
      },
      messages: {
        generic: 'Unable to sign in. Please try again.',
        invalidCredentials: 'Invalid email or password. Please try again.',
        locked:
          'Account is temporarily locked after repeated failures. Contact security for reactivation.',
      },
    });
  }, [callbackUrl, onSuccess]);

  const state = useSyncExternalStore<LoginControllerState>(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  return (
    <LoginCard
      key={state.formInstance}
      title="FX Option Control Room"
      subtitle="Operator access requires secure credentials."
      supportEmail={supportEmail}
      isSubmitting={state.isSubmitting}
      errorMessage={state.errorMessage}
      onSubmit={controller.submit}
      footer="Access is limited to authorised trading operations staff. Credentials rotate every 90 days."
    />
  );
}
