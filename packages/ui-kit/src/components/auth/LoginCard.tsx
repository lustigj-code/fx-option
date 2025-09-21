import * as React from 'react';

import { Button } from '../Button';
import { cn } from '../../lib/utils';

export interface LoginCardProps {
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  supportEmail?: string;
  defaultValues?: {
    email?: string;
    password?: string;
  };
  onSubmit: (values: { email: string; password: string }) => void | Promise<void>;
  footer?: React.ReactNode;
}

export const LoginCard: React.FC<Readonly<LoginCardProps>> = ({
  title = 'Secure sign in',
  subtitle = 'Enter your credentials to continue.',
  submitLabel = 'Sign in',
  isSubmitting = false,
  errorMessage,
  supportEmail,
  defaultValues,
  onSubmit,
  footer,
}) => {
  const [email, setEmail] = React.useState(defaultValues?.email ?? '');
  const [password, setPassword] = React.useState(defaultValues?.password ?? '');

  React.useEffect(() => {
    if (typeof defaultValues?.email === 'string') {
      setEmail(defaultValues.email);
    }
  }, [defaultValues?.email]);

  React.useEffect(() => {
    if (typeof defaultValues?.password === 'string') {
      setPassword(defaultValues.password);
    }
  }, [defaultValues?.password]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ email, password });
  };

  const supportHref = supportEmail ? `mailto:${supportEmail}?subject=Access%20support` : null;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full max-w-md space-y-6 rounded-3xl border border-accent-muted/40 bg-card/80 p-8 shadow-soft backdrop-blur-xl'
      )}
    >
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-text">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </header>
      <div className="space-y-4">
        <label className="block text-left text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-accent-muted/40 bg-background/80 px-4 py-3 text-sm text-text shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          placeholder="you@company.com"
        />
        <label className="block text-left text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-accent-muted/40 bg-background/80 px-4 py-3 text-sm text-text shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          placeholder="••••••••"
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
      <div className="flex flex-col gap-4">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : submitLabel}
        </Button>
        {supportHref && (
          <a
            href={supportHref}
            className="text-center text-sm font-medium text-accent transition hover:text-accent/80"
          >
            Contact support
          </a>
        )}
        {footer}
      </div>
    </form>
  );
};
