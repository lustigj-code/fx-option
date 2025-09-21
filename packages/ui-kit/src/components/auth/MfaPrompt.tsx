import * as React from 'react';

import { Button } from '../Button';

export interface MfaPromptProps {
  title?: string;
  subtitle?: string;
  email?: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  supportEmail?: string;
  onSubmit: (code: string) => void | Promise<void>;
}

export const MfaPrompt: React.FC<Readonly<MfaPromptProps>> = ({
  title = 'Multi-factor authentication',
  subtitle = 'Enter the 6-digit code from your authenticator application.',
  email,
  isSubmitting = false,
  errorMessage,
  supportEmail,
  onSubmit,
}) => {
  const [code, setCode] = React.useState('');

  React.useEffect(() => {
    if (!isSubmitting && !errorMessage) {
      setCode('');
    }
  }, [isSubmitting, errorMessage]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(code.replace(/\s+/g, ''));
  };

  const supportHref = supportEmail ? `mailto:${supportEmail}?subject=MFA%20assistance%20request` : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6 rounded-3xl border border-accent-muted/40 bg-card/80 p-8 text-center shadow-soft"
    >
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-text">{title}</h2>
        <p className="text-sm text-muted">{subtitle}</p>
        {email && (
          <p className="text-xs text-muted">
            Authenticating <span className="font-medium">{email}</span>
          </p>
        )}
      </header>
      <div className="space-y-2">
        <label htmlFor="mfa-code" className="block text-left text-xs font-semibold uppercase tracking-wide text-muted">
          Authenticator code
        </label>
        <input
          id="mfa-code"
          name="code"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="w-full rounded-2xl border border-accent-muted/40 bg-background/80 px-4 py-3 text-sm text-text shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          placeholder="123 456"
        />
      </div>
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}
      <div className="flex flex-col items-center gap-3">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying…' : 'Verify code'}
        </Button>
        {supportHref && (
          <div className="flex flex-col items-center gap-1">
            <a href={supportHref} className="text-sm font-medium text-accent hover:text-accent/80">
              Contact support
            </a>
            <span className="text-xs text-muted">{supportEmail}</span>
          </div>
        )}
      </div>
    </form>
  );
};
