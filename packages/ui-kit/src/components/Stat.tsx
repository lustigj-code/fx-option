import * as React from 'react';

import { cn } from '../lib/utils';

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
}

export const Stat = React.forwardRef<HTMLDivElement, StatProps>(
  ({ className, label, value, trend, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-1 rounded-2xl border border-accent-muted/30 bg-card/60 px-4 py-3 text-left shadow-soft',
        className
      )}
      {...props}
    >
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span className="text-2xl font-semibold text-text">{value}</span>
      {trend && (
        <span
          className={cn(
            'flex items-center gap-1 text-xs font-medium',
            trend.direction === 'up' ? 'text-accent' : 'text-danger'
          )}
        >
          <span>
            {trend.direction === 'up' ? '▲' : '▼'} {trend.value}
          </span>
        </span>
      )}
    </div>
  )
);

Stat.displayName = 'Stat';
