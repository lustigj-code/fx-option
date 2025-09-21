'use client';

import type { AccessDeniedBannerProps } from 'ui-kit';
import { AccessDeniedBanner } from 'ui-kit';

export type AccessDeniedProps = AccessDeniedBannerProps;

export function AccessDenied(props: AccessDeniedProps) {
  return <AccessDeniedBanner {...props} />;
}

export default AccessDenied;
