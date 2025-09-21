import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { SignInForm } from '@/components/auth/SignInForm';
import { authOptions } from '@/lib/auth-options';

interface LoginPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

const normalizeParam = (value: string | string[] | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);
  const callbackUrl = normalizeParam(searchParams?.callbackUrl) ?? '/';

  if (session) {
    redirect(callbackUrl);
  }

  const initialEmail = normalizeParam(searchParams?.email);
  const initialErrorCode = normalizeParam(searchParams?.error);
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? process.env.PORTAL_SUPPORT_EMAIL ?? undefined;

  return (
    <>
      <SignInForm
        callbackUrl={callbackUrl}
        initialEmail={initialEmail}
        initialErrorCode={initialErrorCode}
        supportEmail={supportEmail}
      />
      <p className="text-center text-xs text-muted">
        By continuing you acknowledge access is monitored and subject to compliance review.
      </p>
    </>
  );
}
