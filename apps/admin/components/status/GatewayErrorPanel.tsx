import type { PropsWithChildren, ReactNode } from 'react';
import { useMemo } from 'react';

import { StatusBanner, StatusCard } from 'ui-kit/status';

type GatewayErrorPanelProps = {
  message: string;
  lastChecked?: Date;
  supportContact: string;
  onRetry?: () => void;
  children?: ReactNode;
};

export function GatewayErrorPanel({
  message,
  lastChecked,
  supportContact,
  onRetry,
  children
}: GatewayErrorPanelProps) {
  const subtitle = useMemo(() => {
    if (!lastChecked) return 'Review recent incident notes and escalate if conditions persist.';
    return `Last successful poll ${lastChecked.toLocaleTimeString()}`;
  }, [lastChecked]);

  return (
    <StatusCard
      tone="critical"
      title="Gateway offline"
      subtitle={subtitle}
      actionLabel={onRetry ? 'Retry connection' : undefined}
      onAction={onRetry}
      data-testid="gateway-error-card"
    >
      <div className="space-y-3">
        <StatusBanner tone="critical" data-testid="gateway-error-banner">
          {message}
        </StatusBanner>
        <SupportLine contact={supportContact} />
        {children}
      </div>
    </StatusCard>
  );
}

type SupportLineProps = PropsWithChildren<{ contact: string }>;

function SupportLine({ contact }: SupportLineProps) {
  return (
    <p className="text-sm text-slate-400" data-testid="gateway-support-line">
      Notify treasury operations at <span className="font-medium text-slate-200">{contact}</span> so they can coordinate manual
      fills.
    </p>
  );
}
