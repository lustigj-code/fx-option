'use client';

import * as React from 'react';
import { useSyncExternalStore } from 'react';
import { signIn } from 'next-auth/react';

import { createLoginController, type LoginControllerState } from '@shared/auth';
import { LoginCard } from 'ui-kit';

export interface LoginFormProps {
  onSuccess?: (redirectUrl: string) => void;
  supportEmail?: string;
  callbackUrl?: string;
}

const DEFAULT_CALLBACK_URL = '/app';
const DEFAULT_SUPPORT_EMAIL = 'support@fxportal.local';

export function LoginForm({
  onSuccess,
  supportEmail = DEFAULT_SUPPORT_EMAIL,
  callbackUrl = DEFAULT_CALLBACK_URL,
}: Readonly<LoginFormProps>) {
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
          'Account is temporarily locked due to repeated failures. Contact support for assistance.',
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
      subtitle="Enter your FX Portal credentials to continue."
      supportEmail={supportEmail}
      isSubmitting={state.isSubmitting}
      errorMessage={state.errorMessage}
      onSubmit={controller.submit}
    />
  );
}
