import * as React from 'react';

import { Button } from '../Button';

export interface AccessDeniedCardProps {
  title?: string;
  description: string;
  resourceLabel?: string;
  supportEmail?: string;
  auditTrailUrl?: string;
  onRequestAccess?: () => void;
  actionLabel?: string;
  children?: React.ReactNode;
  supportLinkLabel?: string;
}

export const AccessDeniedCard: React.FC<Readonly<AccessDeniedCardProps>> = ({
  title = 'Access denied',
  description,
  resourceLabel,
  supportEmail,
  auditTrailUrl,
  onRequestAccess,
  actionLabel = 'Request access',
  children,
  supportLinkLabel = 'Contact compliance',
}) => {
  const supportHref = supportEmail
    ? `mailto:${supportEmail}?subject=${
        resourceLabel
          ? `Access%20request%20for%20${encodeURIComponent(resourceLabel)}`
          : 'Access%20request'
      }`
    : null;

  return (
    <section className="w-full max-w-xl space-y-4 rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center shadow-soft">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-destructive">{title}</h2>
        <p className="text-sm text-destructive/80">
          {description}
          {resourceLabel ? ` (${resourceLabel})` : ''}
        </p>
      </header>
      {children && <div className="text-sm text-destructive/80">{children}</div>}
      <div className="flex flex-col items-center justify-center gap-3">
        {onRequestAccess && (
          <Button type="button" variant="secondary" onClick={onRequestAccess}>
            {actionLabel}
          </Button>
        )}
        {supportHref && (
          <a className="text-sm font-medium text-accent" href={supportHref}>
            {supportLinkLabel}
          </a>
        )}
        {auditTrailUrl && (
          <a className="text-xs text-muted hover:text-muted/80" href={auditTrailUrl}>
            View audit trail
          </a>
        )}
      </div>
    </section>
  );
};
