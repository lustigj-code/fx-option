'use client';

import * as React from 'react';

import { AccessDeniedCard } from 'ui-kit';

import { ROLE_LABELS, type AppRole } from '@shared/auth';

export interface RestrictedViewProps {
  currentRoles: AppRole[];
  requiredRoles: AppRole[];
  resourceLabel?: string;
  supportEmail?: string;
  auditTrailUrl?: string;
  onRequestEscalation?: () => void;
  requiresMfa?: boolean;
}

const toUniqueLabels = (roles: AppRole[]): string[] => {
  const seen = new Set<AppRole>();
  const labels: string[] = [];

  for (const role of roles) {
    if (!seen.has(role)) {
      seen.add(role);
      labels.push(ROLE_LABELS[role] ?? role);
    }
  }

  return labels;
};

export function RestrictedView({
  currentRoles,
  requiredRoles,
  resourceLabel,
  supportEmail = 'compliance@fxportal.local',
  auditTrailUrl,
  onRequestEscalation,
  requiresMfa = false,
}: Readonly<RestrictedViewProps>) {
  const requiredRoleLabels = React.useMemo(() => toUniqueLabels(requiredRoles), [requiredRoles]);
  const currentRoleLabels = React.useMemo(() => toUniqueLabels(currentRoles), [currentRoles]);
  const supportLinkLabel = requiresMfa ? 'Contact support' : 'Email compliance';

  const description = requiresMfa
    ? 'Complete multi-factor authentication to unlock privileged actions.'
    : 'Additional privileged roles are required to continue.';

  return (
    <AccessDeniedCard
      title="Restricted area"
      description={description}
      resourceLabel={resourceLabel}
      supportEmail={supportEmail}
      supportLinkLabel={supportLinkLabel}
      auditTrailUrl={auditTrailUrl}
      onRequestAccess={onRequestEscalation}
      actionLabel={onRequestEscalation ? 'Request escalation' : undefined}
    >
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-destructive/80">Required roles</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {requiredRoleLabels.map((label) => (
              <li key={`required-${label}`}>{label}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-destructive/80">Your roles</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {currentRoleLabels.length > 0 ? (
              currentRoleLabels.map((label) => <li key={`current-${label}`}>{label}</li>)
            ) : (
              <li key="current-none">No roles assigned</li>
            )}
          </ul>
        </div>
        {requiresMfa && (
          <p className="text-sm text-destructive">
            Complete multi-factor authentication using your registered security key or authenticator application.
          </p>
        )}
      </div>
    </AccessDeniedCard>
  );
}
