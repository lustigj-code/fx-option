'use client';

import { ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { Button } from '../Button';

export interface AccessDeniedBannerProps {
  title?: string;
  description?: ReactNode;
  actionLabel?: string;
  onRequestAccess?: () => void;
  supportEmail?: string;
  className?: string;
  children?: ReactNode;
}

const defaultTitle = 'Access denied';
const defaultDescription = 'You do not have permission to view this resource.';

export function AccessDeniedBanner({
  title = defaultTitle,
  description = defaultDescription,
  actionLabel = 'Request access',
  onRequestAccess,
  supportEmail,
  className,
  children,
}: AccessDeniedBannerProps) {
  return (
    <div
      className={cn(
        'space-y-4 rounded-3xl border border-amber-400/30 bg-amber-950/40 p-6 text-amber-100 shadow-soft',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-amber-50">{title}</h2>
        {typeof description === 'string' ? (
          <p className="text-sm text-amber-100/90">{description}</p>
        ) : (
          description
        )}
      </div>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        {onRequestAccess ? (
          <Button type="button" variant="secondary" onClick={onRequestAccess}>
            {actionLabel}
          </Button>
        ) : null}
        {supportEmail ? (
          <a
            className="text-sm font-medium text-amber-200 underline-offset-4 hover:underline"
            href={`mailto:${supportEmail}`}
          >
            Contact compliance
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default AccessDeniedBanner;
