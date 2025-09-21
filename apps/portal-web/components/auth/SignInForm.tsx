'use client';

import { useEffect, useState } from 'react';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import type { LoginFormValues } from '@/components/auth/LoginForm';
import { LoginForm } from '@/components/auth/LoginForm';
import { mapAuthError } from '@shared/auth';

interface SignInFormProps {
  callbackUrl?: string;
  initialEmail?: string;
  initialErrorCode?: string;
  supportEmail?: string;
}

const REMEMBER_DEVICE_KEY = 'fx-portal:remember-device';

const mapInitialError = (code?: string): string | null => {
  const message = mapAuthError(code ?? null);
  return message.length > 0 ? message : null;
};

export function SignInForm({
  callbackUrl = '/',
  initialEmail,
  initialErrorCode,
  supportEmail,
}: SignInFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(mapInitialError(initialErrorCode));

  useEffect(() => {
    setError(mapInitialError(initialErrorCode));
  }, [initialErrorCode]);

  const handleSubmit = async ({ email, password, rememberDevice }: LoginFormValues) => {
    if (pending) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result) {
        throw new Error('No response from identity provider');
      }

      if (result.error) {
        setError(mapAuthError(result.error));
        return;
      }

      if (rememberDevice) {
        window.localStorage.setItem(REMEMBER_DEVICE_KEY, new Date().toISOString());
      } else {
        window.localStorage.removeItem(REMEMBER_DEVICE_KEY);
      }

      const target = result.url ?? callbackUrl;
      router.push(target);
      router.refresh();
    } catch (submitError) {
      console.error('Portal sign-in failed', submitError);
      setError(mapAuthError('Default'));
    } finally {
      setPending(false);
    }
  };

  return (
    <LoginForm
      onSubmit={handleSubmit}
      initialEmail={initialEmail}
      pending={pending}
      error={error ?? undefined}
      supportEmail={supportEmail}
    />
  );
}

export default SignInForm;
