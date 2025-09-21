'use client';

import { ReactNode } from 'react';

import { AccessDeniedBanner } from 'ui-kit';

export type RestrictedStatus = 'loading' | 'authorized' | 'forbidden';
export type RestrictedReason = 'missing-role' | 'mfa-required' | 'unauthenticated';

export interface RestrictedViewProps {
  status: RestrictedStatus;
  reason?: RestrictedReason;
  children: ReactNode;
  onRequestAccess?: () => void;
  onStartMfa?: () => void;
  supportEmail?: string;
  loadingFallback?: ReactNode;
}

const LoadingState = () => (
  <div className="space-y-3 rounded-3xl border border-accent-muted/30 bg-card/60 p-6 text-sm text-muted">
    <div className="h-4 w-32 animate-pulse rounded bg-accent/20" />
    <div className="h-4 w-48 animate-pulse rounded bg-accent/10" />
    <div className="h-4 w-40 animate-pulse rounded bg-accent/10" />
  </div>
);

export function RestrictedView({
  status,
  reason,
  children,
  onRequestAccess,
  onStartMfa,
  supportEmail,
  loadingFallback,
}: RestrictedViewProps) {
  if (status === 'loading') {
    return <>{loadingFallback ?? <LoadingState />}</>;
  }

  if (status === 'authorized') {
    return <>{children}</>;
  }

  if (status === 'forbidden') {
    if (reason === 'mfa-required') {
      return (
        <AccessDeniedBanner
          title="Multi-factor authentication required"
          description="Set up MFA to continue to privileged admin operations."
          actionLabel={onStartMfa ? 'Set up MFA' : undefined}
          onRequestAccess={onStartMfa}
          supportEmail={supportEmail}
        />
      );
    }

    return (
      <AccessDeniedBanner
        title="Restricted access"
        description="Missing the required admin role for this section."
        actionLabel={onRequestAccess ? 'Request access' : undefined}
        onRequestAccess={onRequestAccess}
        supportEmail={supportEmail}
      />
    );
  }

  return null;
}

export default RestrictedView;
