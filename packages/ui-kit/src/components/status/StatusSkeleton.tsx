import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

import type { StatusTone } from './StatusCard';

const skeletonToneClasses: Record<StatusTone, string> = {
  neutral: 'bg-slate-500/30',
  info: 'bg-sky-500/30',
  success: 'bg-emerald-500/30',
  warning: 'bg-amber-500/30',
  critical: 'bg-rose-500/40',
};

export interface StatusSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  tone?: StatusTone;
  lines?: number;
  label?: string;
}

export function StatusSkeleton({
  tone = 'neutral',
  lines = 3,
  label = 'Loading latest market data',
  className,
  ...props
}: StatusSkeletonProps) {
  const toneClass = skeletonToneClasses[tone];
  const shimmerLines = Math.max(1, Math.min(lines, 6));

  return (
    <div className={clsx('space-y-3', className)} role="status" aria-live="polite" {...props}>
      <p className="text-sm text-white/70">{label}</p>
      <div className="space-y-2">
        {Array.from({ length: shimmerLines }).map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={clsx('h-3 w-full animate-pulse rounded-full', toneClass)}
            style={{ animationDelay: `${index * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
