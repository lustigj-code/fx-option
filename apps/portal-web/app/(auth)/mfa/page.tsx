import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import MfaVerificationView from './view';
import { authOptions } from '@/lib/auth-options';

interface MfaPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

const normalizeParam = (value: string | string[] | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
};

const verifyEndpoint = process.env.PORTAL_MFA_VERIFY_ENDPOINT ?? undefined;
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? process.env.PORTAL_SUPPORT_EMAIL ?? undefined;

export default async function MfaPage({ searchParams }: MfaPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  if (session.user?.mfaVerified) {
    redirect('/');
  }

  const callbackUrl = normalizeParam(searchParams?.callbackUrl) ?? '/';

  return (
    <MfaVerificationView
      verifyEndpoint={verifyEndpoint}
      supportEmail={supportEmail}
      callbackUrl={callbackUrl}
    />
  );
}
