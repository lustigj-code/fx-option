declare module 'ui-kit/status' {
  import type { ReactNode } from 'react';

  export type StatusTone = 'critical' | 'warning' | 'info' | 'success' | 'neutral';

  export type StatusCardProps = {
    tone?: StatusTone;
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
    children?: ReactNode;
    [key: string]: unknown;
  };

  export type StatusBannerProps = {
    tone?: StatusTone;
    children?: ReactNode;
    [key: string]: unknown;
  };

  export type StatusSkeletonProps = {
    tone?: StatusTone;
    lines?: number;
    label?: string;
    children?: ReactNode;
    [key: string]: unknown;
  };

  export const StatusCard: (props: StatusCardProps) => ReactNode;
  export const StatusBanner: (props: StatusBannerProps) => ReactNode;
  export const StatusSkeleton: (props: StatusSkeletonProps) => ReactNode;
}
