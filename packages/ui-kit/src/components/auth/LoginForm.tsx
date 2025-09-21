'use client';

import { FormEvent, useState } from 'react';

import { cn } from '../../lib/utils';
import { Button } from '../Button';

export interface LoginFormValues {
  email: string;
  password: string;
  rememberDevice: boolean;
}

export interface LoginFormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  /** Callback invoked with the captured credentials. */
  onSubmit: (values: LoginFormValues) => Promise<void> | void;
  /** Initial email value, useful when pre-filling from query params. */
  initialEmail?: string;
  /** Displayed above the form controls. */
  title?: string;
  /** Additional context message below the title. */
  subtitle?: string;
  /** Whether to disable inputs during async submission. */
  pending?: boolean;
  /** Inline error surfaced beneath the password field. */
  error?: string | null;
  /** Optional mailto link rendered for support escalations. */
  supportEmail?: string;
  /** Custom label for the remember device checkbox. */
  rememberDeviceLabel?: string;
  /** Custom label for the submit button. */
  submitLabel?: string;
}

const defaultTitle = 'Sign in to continue';
const defaultSubtitle =
  'Access is restricted to authorised FX Portal users. Credentials rotate every 90 days.';
const defaultRememberDeviceLabel = 'Remember device for 30 days';
const defaultSubmitLabel = 'Sign in';

export function LoginForm({
  className,
  onSubmit,
  initialEmail = '',
  title = defaultTitle,
  subtitle = defaultSubtitle,
  pending = false,
  error,
  supportEmail,
  rememberDeviceLabel = defaultRememberDeviceLabel,
  submitLabel = defaultSubmitLabel,
  ...formProps
}: LoginFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) {
      return;
    }
    await onSubmit({
      email,
      password,
      rememberDevice,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'space-y-6 rounded-3xl border border-accent-muted/30 bg-card/80 p-8 shadow-soft backdrop-blur-xl',
        'transition-shadow duration-200 hover:shadow-accent/20',
        className
      )}
      aria-busy={pending}
      {...formProps}
    >
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-text">{title}</h1>
        {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
      </div>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 text-left">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="rounded-2xl border border-accent-muted/40 bg-background/90 px-4 py-3 text-sm text-text shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            required
          />
        </div>
        <div className="flex flex-col gap-2 text-left">
          <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="rounded-2xl border border-accent-muted/40 bg-background/90 px-4 py-3 text-sm text-text shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
            required
          />
        </div>
        <label className="flex items-center gap-3 text-left text-sm text-muted">
          <input
            id="remember-device"
            name="remember-device"
            type="checkbox"
            className="h-4 w-4 rounded border border-accent-muted/40 bg-background/80 text-accent focus:ring-accent/60"
            checked={rememberDevice}
            onChange={(event) => setRememberDevice(event.target.checked)}
            disabled={pending}
          />
          <span>{rememberDeviceLabel}</span>
        </label>
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-500/40 bg-rose-950/60 px-4 py-3 text-sm text-rose-200"
        >
          {error}
        </div>
      ) : null}
      <Button
        type="submit"
        className="w-full"
        disabled={pending}
      >
        {pending ? 'Signing in…' : submitLabel}
      </Button>
      {supportEmail ? (
        <p className="text-center text-xs text-muted">
          Trouble signing in?{' '}
          <a
            className="font-medium text-accent hover:underline"
            href={`mailto:${supportEmail}`}
          >
            Contact support
          </a>
          .
        </p>
      ) : null}
    </form>
  );
}

export default LoginForm;
