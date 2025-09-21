'use client';

import { FormEvent, useState } from 'react';

import { cn } from '../../lib/utils';
import { Button } from '../Button';

export interface MfaPromptProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  onSubmit: (code: string) => Promise<void> | void;
  pending?: boolean;
  error?: string | null;
  supportEmail?: string;
  onUseRecoveryCode?: () => void;
  onResendCode?: () => void;
  title?: string;
  description?: string;
}

const defaultTitle = 'Multi-factor authentication';
const defaultDescription = 'Enter the verification code from your authenticator device.';

export function MfaPrompt({
  className,
  onSubmit,
  pending = false,
  error,
  supportEmail,
  onUseRecoveryCode,
  onResendCode,
  title = defaultTitle,
  description = defaultDescription,
  ...formProps
}: MfaPromptProps) {
  const [code, setCode] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) {
      return;
    }
    await onSubmit(code);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'space-y-6 rounded-3xl border border-accent-muted/30 bg-card/80 p-6 shadow-soft backdrop-blur-xl',
        className
      )}
      aria-busy={pending}
      {...formProps}
    >
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold text-text">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <div className="space-y-2 text-left">
        <label htmlFor="mfa-code" className="text-xs font-semibold uppercase tracking-wide text-muted">
          Verification code
        </label>
        <input
          id="mfa-code"
          name="mfa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="rounded-2xl border border-accent-muted/40 bg-background/90 px-4 py-3 text-sm text-text shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\s+/g, ''))}
          disabled={pending}
          required
        />
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-500/40 bg-rose-950/60 px-4 py-3 text-sm text-rose-200"
        >
          {error}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? 'Verifying…' : 'Verify code'}
          </Button>
          {onResendCode ? (
            <Button type="button" variant="ghost" onClick={onResendCode} disabled={pending}>
              Resend code
            </Button>
          ) : null}
        </div>
        {onUseRecoveryCode ? (
          <Button
            type="button"
            variant="ghost"
            className="px-0 text-sm font-semibold text-accent hover:underline"
            onClick={onUseRecoveryCode}
          >
            Use recovery code
          </Button>
        ) : null}
      </div>
      {supportEmail ? (
        <p className="text-center text-xs text-muted">
          Need help?{' '}
          <a className="font-medium text-accent hover:underline" href={`mailto:${supportEmail}`}>
            Contact compliance
          </a>
          .
        </p>
      ) : null}
    </form>
  );
}

export default MfaPrompt;
