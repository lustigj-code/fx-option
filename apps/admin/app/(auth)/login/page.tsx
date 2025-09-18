import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/LoginForm';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

export default function LoginPage() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (session) {
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
