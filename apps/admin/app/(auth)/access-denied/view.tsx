'use client';

import { AccessDeniedBanner } from 'ui-kit';

interface AccessDeniedViewProps {
  supportEmail?: string;
}

export default function AccessDeniedView({ supportEmail }: AccessDeniedViewProps) {
  return (
    <AccessDeniedBanner
      title="Restricted access"
      description="You are missing the required admin role to view the control room."
      supportEmail={supportEmail}
      actionLabel={supportEmail ? 'Request access' : undefined}
      onRequestAccess={supportEmail ? () => window.open(`mailto:${supportEmail}`) : undefined}
    />
  );
}
