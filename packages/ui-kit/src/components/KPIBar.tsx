import * as React from 'react';

import { cn } from '../lib/utils';

export interface KPIBarProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: number;
  target?: number;
}

export const KPIBar = React.forwardRef<HTMLDivElement, KPIBarProps>(
  ({ className, label, value, target = 100, ...props }, ref) => {
    const percentage = Math.min(100, Math.round((value / target) * 100));

    return (
      <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props}>
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
          <span>{label}</span>
          <span className="text-text">{percentage}%</span>
        </div>
        <div className="h-3 rounded-full bg-accent-muted/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent/80 shadow-glow"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

KPIBar.displayName = 'KPIBar';
