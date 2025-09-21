import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

import type { StatusTone } from './StatusCard';

const bannerToneClasses: Record<StatusTone, string> = {
  neutral: 'bg-slate-800/70 text-slate-100 border border-slate-600/60',
  info: 'bg-sky-900/60 text-sky-100 border border-sky-500/40',
  success: 'bg-emerald-900/60 text-emerald-100 border border-emerald-500/40',
  warning: 'bg-amber-900/60 text-amber-100 border border-amber-500/40',
  critical: 'bg-rose-900/70 text-rose-100 border border-rose-500/45',
};

export interface StatusBannerProps extends HTMLAttributes<HTMLDivElement> {
  tone?: StatusTone;
  icon?: ReactNode;
  children?: ReactNode;
}

export function StatusBanner({ tone = 'neutral', icon, children, className, ...props }: StatusBannerProps) {
  return (
    <div
      className={clsx(
        'flex items-start gap-3 rounded-2xl px-4 py-3 text-sm shadow-inner shadow-black/20',
        bannerToneClasses[tone],
        className
      )}
      role={tone === 'critical' ? 'alert' : undefined}
      {...props}
    >
      {icon ? (
        <span className="mt-0.5 shrink-0 text-lg" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <div className="space-y-1">{children}</div>
    </div>
  );
}
