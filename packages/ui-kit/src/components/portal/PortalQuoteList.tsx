import * as React from 'react';

import { cn } from '../../lib/utils';
import { portalTheme } from './theme';

function formatRate(value: number): string {
  if (Number.isNaN(value)) {
    return '—';
  }
  return value.toFixed(4);
}

function formatSpread(spreadBps: number): string {
  if (Number.isNaN(spreadBps)) {
    return '—';
  }
  return `${spreadBps.toFixed(1)} bps`;
}

function formatValidUntil(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export interface PortalQuoteListItem {
  dealer: string;
  midRate: number;
  spreadBps: number;
  validUntil: string;
  best?: boolean;
}

export interface PortalQuoteListProps extends React.HTMLAttributes<HTMLDivElement> {
  currencyPair: string;
  offers: PortalQuoteListItem[];
  emptyState?: React.ReactNode;
}

export const PortalQuoteList = React.forwardRef<HTMLDivElement, PortalQuoteListProps>(
  ({ currencyPair, offers, emptyState, className, ...props }, ref) => {
    if (!offers.length) {
      return (
        <div ref={ref} className={cn(portalTheme.containers.card, className)} {...props}>
          <div className="flex items-start justify-between">
            <div>
              <p className={portalTheme.text.label}>Quotes</p>
              <p className={portalTheme.text.heading}>{currencyPair}</p>
            </div>
          </div>
          <div className={cn(portalTheme.containers.surface, 'text-center text-sm text-muted')}>
            {emptyState ?? 'No dealer quotes available. Retry shortly.'}
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn(portalTheme.containers.card, className)} {...props}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={portalTheme.text.label}>Quotes</p>
            <p className={portalTheme.text.heading}>{currencyPair}</p>
          </div>
          <span className={cn(portalTheme.badges.base, portalTheme.badges.covered)}>
            Book Depth {offers.length}
          </span>
        </div>

        <ul className="flex flex-col gap-3">
          {offers.map((offer) => (
            <li
              key={`${offer.dealer}-${offer.validUntil}`}
              className={cn(
                portalTheme.containers.surface,
                'flex items-center justify-between gap-4 border-white/10 bg-white/5',
                offer.best && 'border-accent bg-accent/10 shadow-glow'
              )}
            >
              <div className="flex flex-1 items-center gap-4">
                <div className="flex min-w-[120px] flex-col">
                  <span className={portalTheme.text.label}>Dealer</span>
                  <span className="text-sm font-semibold text-text">{offer.dealer}</span>
                </div>
                <div className="flex min-w-[110px] flex-col">
                  <span className={portalTheme.text.label}>Mid</span>
                  <span className="text-lg font-semibold text-text">{formatRate(offer.midRate)}</span>
                </div>
                <div className="flex min-w-[110px] flex-col">
                  <span className={portalTheme.text.label}>Spread</span>
                  <span className="text-sm font-semibold text-muted">{formatSpread(offer.spreadBps)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end text-right">
                {offer.best ? (
                  <span className={cn(portalTheme.badges.base, portalTheme.badges.bestQuote)}>Best Quote</span>
                ) : null}
                <span className={portalTheme.text.helper}>Valid {formatValidUntil(offer.validUntil)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
);

PortalQuoteList.displayName = 'PortalQuoteList';
