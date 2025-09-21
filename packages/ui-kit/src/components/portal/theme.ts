export type PortalPolicyStatus = 'covered' | 'warning' | 'critical';

export const portalTheme = {
  containers: {
    card: 'glass-card relative flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/10 p-6 text-text shadow-soft backdrop-blur-2xl',
    surface: 'rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-xl'
  },
  text: {
    label: 'text-xs font-semibold uppercase tracking-wider text-muted',
    heading: 'text-xl font-semibold text-text',
    metric: 'text-3xl font-semibold text-text',
    helper: 'text-xs text-muted/90'
  },
  badges: {
    base: 'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest',
    covered: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300',
    warning: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
    critical: 'border-rose-400/40 bg-rose-500/10 text-rose-200',
    bestQuote: 'border-accent bg-accent/15 text-accent'
  },
  metrics: {
    emphasis: 'text-accent',
    neutral: 'text-muted',
    negative: 'text-danger'
  },
  progress: {
    track: 'h-2 w-full overflow-hidden rounded-full bg-white/10',
    indicator: 'h-full rounded-full bg-accent shadow-glow'
  }
} as const;

export const portalPolicyStatusCopy: Record<PortalPolicyStatus, string> = {
  covered: 'Covered',
  warning: 'Policy Warning',
  critical: 'Policy Breach'
};

export function portalPolicyStatusBadge(status: PortalPolicyStatus): string {
  return [portalTheme.badges.base, portalTheme.badges[status]].join(' ');
}

export function portalAlertsBadge(alerts: number): string {
  if (alerts <= 0) {
    return [portalTheme.badges.base, portalTheme.badges.covered].join(' ');
  }
  if (alerts > 2) {
    return [portalTheme.badges.base, portalTheme.badges.critical].join(' ');
  }
  return [portalTheme.badges.base, portalTheme.badges.warning].join(' ');
}
