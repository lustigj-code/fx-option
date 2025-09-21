import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/LoginForm';
import { authOptions } from '@/lib/auth-options';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    if ((session as any).requiresMfa) {
      redirect(`/auth/mfa?callbackUrl=${encodeURIComponent('/')}`);
    }
    redirect('/');
  }

  return (
    <>
      <LoginForm />
      <p className="text-center text-xs text-slate-500">
        Trouble signing in? Contact the trading operations lead to rotate your hardware token.
      </p>
    </>
  );
}
