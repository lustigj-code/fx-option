import * as React from 'react';

import { cn } from '../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, header, footer, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'glass-card flex flex-col gap-4 rounded-2xl p-6 shadow-soft backdrop-blur-xl',
        className
      )}
      {...props}
    >
      {header && <div className="text-sm font-medium text-muted">{header}</div>}
      <div className="flex-1 text-base text-text">{children}</div>
      {footer && <div className="pt-2 text-xs text-muted">{footer}</div>}
    </div>
  )
);

Card.displayName = 'Card';
