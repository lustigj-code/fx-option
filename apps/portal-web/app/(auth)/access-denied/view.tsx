'use client';

import { AccessDenied } from '@/components/auth/AccessDenied';

interface AccessDeniedViewProps {
  supportEmail?: string;
}

export default function AccessDeniedView({ supportEmail }: AccessDeniedViewProps) {
  return (
    <AccessDenied
      supportEmail={supportEmail}
      description="You do not have permission to view this area of the FX Portal."
      actionLabel={supportEmail ? 'Request elevated access' : undefined}
      onRequestAccess={supportEmail ? () => window.open(`mailto:${supportEmail}`) : undefined}
    />
  );
}
