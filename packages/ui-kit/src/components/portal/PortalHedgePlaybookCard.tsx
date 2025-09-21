import * as React from 'react';

import { cn } from '../../lib/utils';
import { portalAlertsBadge, portalTheme } from './theme';

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

function formatDateLabel(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function driftTone(drift: number): string {
  if (drift > 0.5) {
    return portalTheme.metrics.negative;
  }
  if (drift < -0.5) {
    return portalTheme.metrics.emphasis;
  }
  return portalTheme.metrics.neutral;
}

function driftLabel(drift: number): string {
  const rounded = Math.round(drift * 10) / 10;
  const prefix = rounded > 0 ? '+' : '';
  return `${prefix}${rounded.toFixed(Math.abs(rounded % 1) > 0 ? 1 : 0)}% drift`;
}

export interface PortalHedgePlaybookCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  coverage: number;
  drift: number;
  alerts: number;
  nextAction: string;
  nextActionLabel?: string;
}

export const PortalHedgePlaybookCard = React.forwardRef<HTMLDivElement, PortalHedgePlaybookCardProps>(
  ({ title, description, coverage, drift, alerts, nextAction, nextActionLabel, className, ...props }, ref) => {
    const normalizedCoverage = clampPercent(coverage);
    const coverageLabel = formatPercent(normalizedCoverage);
    const actionLabel = nextActionLabel ?? formatDateLabel(nextAction);

    return (
      <div ref={ref} className={cn(portalTheme.containers.card, className)} {...props}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={portalTheme.text.label}>Playbook</p>
            <p className={portalTheme.text.heading}>{title}</p>
            <p className={cn('mt-2 text-sm leading-relaxed text-muted/90')}>{description}</p>
          </div>
          {alerts > 0 ? (
            <span className={portalAlertsBadge(alerts)}>{alerts} Alert{alerts === 1 ? '' : 's'}</span>
          ) : (
            <span className={portalAlertsBadge(0)}>No Alerts</span>
          )}
        </div>

        <div className={cn(portalTheme.containers.surface, 'flex flex-wrap items-center justify-between gap-4')}> 
          <div>
            <p className={portalTheme.text.label}>Coverage</p>
            <p className={cn(portalTheme.text.metric, portalTheme.metrics.emphasis)}>{coverageLabel}</p>
          </div>
          <div className="text-right">
            <p className={portalTheme.text.label}>Drift</p>
            <p className={cn('text-lg font-semibold', driftTone(drift))}>{driftLabel(drift)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div
            className={portalTheme.progress.track}
            role="progressbar"
            aria-label="Coverage progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(normalizedCoverage)}
          >
            <div
              className={portalTheme.progress.indicator}
              style={{ width: `${normalizedCoverage}%` }}
              aria-hidden="true"
            />
          </div>
          <p className={portalTheme.text.helper}>Next action {actionLabel}</p>
        </div>
      </div>
    );
  }
);

PortalHedgePlaybookCard.displayName = 'PortalHedgePlaybookCard';
