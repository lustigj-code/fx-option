import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

import { Button } from '../Button';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'critical';

const toneClasses: Record<StatusTone, string> = {
  neutral: 'border-slate-700/50 bg-slate-900/40 text-slate-100',
  info: 'border-sky-500/40 bg-sky-950/50 text-sky-50',
  success: 'border-emerald-500/40 bg-emerald-950/50 text-emerald-50',
  warning: 'border-amber-500/40 bg-amber-950/50 text-amber-50',
  critical: 'border-rose-500/45 bg-rose-950/60 text-rose-50',
};

export interface StatusCardProps extends HTMLAttributes<HTMLElement> {
  tone?: StatusTone;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  children?: ReactNode;
}

export function StatusCard({
  tone = 'neutral',
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
  className,
  ...props
}: StatusCardProps) {
  const toneClass = toneClasses[tone];
  const showAction = Boolean(actionLabel && onAction);

  return (
    <section
      className={clsx(
        'relative overflow-hidden rounded-3xl border px-6 py-7 shadow-lg shadow-black/30 backdrop-blur',
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-40',
        toneClass,
        className
      )}
      {...props}
    >
      <div className="relative z-10 flex flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <h3 className="text-xl font-semibold leading-tight">{title}</h3>
            {subtitle ? <p className="text-sm text-white/70">{subtitle}</p> : null}
          </div>
          {showAction ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onAction}
              className="self-start"
            >
              {actionLabel}
            </Button>
          ) : null}
        </header>
        {children ? <div className="space-y-4 text-sm text-white/80">{children}</div> : null}
      </div>
    </section>
  );
}
