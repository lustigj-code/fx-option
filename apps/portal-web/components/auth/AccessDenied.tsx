'use client';

import * as React from 'react';

import { AccessDeniedCard } from 'ui-kit';

export interface AccessDeniedProps {
  resourceLabel?: string;
  supportEmail?: string;
  auditTrailUrl?: string;
  onRequestAccess?: () => void;
  actionLabel?: string;
}

const DEFAULT_SUPPORT_EMAIL = 'compliance@fxportal.local';

export function AccessDenied({
  resourceLabel,
  supportEmail = DEFAULT_SUPPORT_EMAIL,
  auditTrailUrl,
  onRequestAccess,
  actionLabel,
}: Readonly<AccessDeniedProps>) {
  return (
    <AccessDeniedCard
      description="You do not have permission to view this content."
      resourceLabel={resourceLabel}
      supportEmail={supportEmail}
      auditTrailUrl={auditTrailUrl}
      onRequestAccess={onRequestAccess}
      actionLabel={actionLabel}
    />
  );
}
