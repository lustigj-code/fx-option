import type { PropsWithChildren, ReactNode } from "react";

export const Badge = ({ children }: PropsWithChildren): ReactNode => (
  <span data-testid="badge">{children}</span>
);

type ButtonProps = PropsWithChildren<{ className?: string; type?: string; variant?: string }>;

export const Button = ({ children }: ButtonProps): ReactNode => (
  <button data-variant={"primary"} data-testid="button">
    {children}
  </button>
);

type StatusProps = PropsWithChildren<{
  tone?: string;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}>;

export const StatusCard = ({ children, title }: StatusProps): ReactNode => (
  <section data-testid="status-card" data-title={title}>
    {children}
  </section>
);

export const StatusBanner = ({ children, tone }: PropsWithChildren<{ tone?: string; className?: string }>): ReactNode => (
  <div data-testid="status-banner" data-tone={tone}>
    {children}
  </div>
);

type SkeletonProps = PropsWithChildren<{ tone?: string; lines?: number; label?: string; className?: string }>;

export const StatusSkeleton = ({ children, label = 'Loading latest market data' }: SkeletonProps): ReactNode => (
  <div data-testid="status-skeleton">
    <p>{label}</p>
    {children}
  </div>
);
