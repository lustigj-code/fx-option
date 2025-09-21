import * as React from 'react';

import { cn } from '../../lib/utils';
import {
  portalPolicyStatusBadge,
  portalPolicyStatusCopy,
  portalTheme,
  type PortalPolicyStatus
} from './theme';

function clampPercent(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
}

function formatPercent(value: number): string {
  const normalized = clampPercent(value);
  if (Number.isInteger(normalized)) {
    return `${normalized.toFixed(0)}%`;
  }
  return `${normalized.toFixed(1)}%`;
}

function formatUpdatedLabel(updatedAt: string, override?: string): string {
  if (override) {
    return override;
  }
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return updatedAt;
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export interface PortalExposureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  currencyPair: string;
  netExposure: string;
  hedgedPercent: number;
  policyStatus: PortalPolicyStatus;
  updatedAt: string;
  updatedLabel?: string;
}

export const PortalExposureCard = React.forwardRef<HTMLDivElement, PortalExposureCardProps>(
  (
    { currencyPair, netExposure, hedgedPercent, policyStatus, updatedAt, updatedLabel, className, ...props },
    ref
  ) => {
    const normalized = clampPercent(hedgedPercent);
    const percentLabel = formatPercent(normalized);
    const timestampLabel = formatUpdatedLabel(updatedAt, updatedLabel);

    return (
      <div ref={ref} className={cn(portalTheme.containers.card, className)} {...props}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={portalTheme.text.label}>Currency Pair</p>
            <p className={portalTheme.text.heading}>{currencyPair}</p>
          </div>
          <span className={portalPolicyStatusBadge(policyStatus)}>{portalPolicyStatusCopy[policyStatus]}</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className={portalTheme.text.label}>Net Exposure</p>
            <p className={cn(portalTheme.text.metric, portalTheme.metrics.emphasis)}>{netExposure}</p>
          </div>
          <div className="text-right">
            <p className={portalTheme.text.label}>Hedged</p>
            <p className={cn(portalTheme.text.heading, portalTheme.metrics.neutral)}>{percentLabel}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div
            className={portalTheme.progress.track}
            role="progressbar"
            aria-label="Hedged percentage"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(normalized)}
          >
            <div
              className={portalTheme.progress.indicator}
              style={{ width: `${normalized}%` }}
              aria-hidden="true"
            />
          </div>
          <p className={portalTheme.text.helper}>Updated {timestampLabel}</p>
        </div>
      </div>
    );
  }
);

PortalExposureCard.displayName = 'PortalExposureCard';
