import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { Card } from 'ui-kit';

import { authOptions } from '@/lib/auth-options';
import { MfaChallenge } from '@/components/auth/MfaChallenge';
import { ensureMfaEnrollment } from '@shared/auth';

interface MfaPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

const SUPPORT_EMAIL = process.env.ADMIN_SUPPORT_EMAIL ?? 'security@fxportal.local';
const MFA_ISSUER = process.env.ADMIN_AUTH_MFA_ISSUER ?? 'FX Option Admin';

const resolveCallbackUrl = (raw?: string): string => {
  if (!raw) {
    return '/';
  }
  try {
    return decodeURIComponent(raw);
  } catch (error) {
    return raw;
  }
};

export default async function MfaPage({ searchParams }: MfaPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  if (!session.user?.id) {
    redirect('/auth/login');
  }

  const callbackUrl = resolveCallbackUrl(
    typeof searchParams?.callbackUrl === 'string' ? searchParams.callbackUrl : undefined,
  );

  if (session.user.mfaVerified) {
    redirect(callbackUrl);
  }

  const enrollment = ensureMfaEnrollment({
    userId: session.user.id,
    issuer: MFA_ISSUER,
    label: session.user.email ?? session.user.id,
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-12">
      <Card
        className="space-y-4"
        header={<span className="text-base font-semibold text-text">Secure your account</span>}
      >
        <p className="text-sm text-muted">
          Scan the QR code or enter the secret below in your authenticator application. Keep the
          recovery codes in a safe place—they can be used if you lose access to your authenticator.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-2xl border border-accent-muted/40 bg-card/80 p-4 shadow-inner">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Authenticator secret</h3>
            <code className="block break-all rounded-xl bg-background/80 px-3 py-2 text-sm text-text">
              {enrollment.secret}
            </code>
            <a
              href={enrollment.uri}
              className="text-sm font-medium text-accent hover:text-accent/80"
              target="_blank"
              rel="noreferrer"
            >
              Open authenticator setup
            </a>
          </div>
          <div className="space-y-2 rounded-2xl border border-accent-muted/40 bg-card/80 p-4 shadow-inner">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Recovery codes</h3>
            <ul className="grid grid-cols-2 gap-2 text-sm text-text">
              {enrollment.recoveryCodes.map((code) => (
                <li key={code} className="rounded-lg bg-background/80 px-3 py-2 text-center font-mono text-sm">
                  {code}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
      <div className="mx-auto w-full max-w-md">
        <MfaChallenge
          email={session.user.email ?? undefined}
          supportEmail={SUPPORT_EMAIL}
          callbackUrl={callbackUrl}
        />
      </div>
    </div>
  );
}
