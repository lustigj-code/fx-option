import * as React from 'react';

import { cn } from '../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'accent' | 'muted';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = 'accent', ...props }, ref) => {
    const tones = {
      accent: 'bg-accent/15 text-accent border border-accent/40',
      muted: 'bg-accent-muted/40 text-text border border-accent-muted/60'
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-4 py-1 text-xs font-medium uppercase tracking-wide backdrop-blur-sm',
          tones[tone],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
