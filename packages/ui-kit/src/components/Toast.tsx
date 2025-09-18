import * as React from 'react';

import { cn } from '../lib/utils';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  status?: 'default' | 'success' | 'danger';
  action?: React.ReactNode;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, title, description, status = 'default', action, ...props }, ref) => {
    const tone = {
      default: 'border-accent-muted/40 bg-card/80 text-text',
      success: 'border-accent/40 bg-accent-muted/30 text-accent',
      danger: 'border-danger/40 bg-danger/15 text-danger'
    }[status];

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start gap-4 rounded-2xl border px-5 py-4 shadow-soft backdrop-blur-xl',
          tone,
          className
        )}
        role="status"
        {...props}
      >
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
        {action}
      </div>
    );
  }
);

Toast.displayName = 'Toast';
