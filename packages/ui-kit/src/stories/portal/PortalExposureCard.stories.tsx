import type { Meta, StoryObj } from '@storybook/react';

import { PortalExposureCard, type PortalPolicyStatus } from '../../components/portal';

const meta: Meta<typeof PortalExposureCard> = {
  title: 'Portal/ExposureCard',
  component: PortalExposureCard,
  args: {
    currencyPair: 'EUR / USD',
    netExposure: '$4.8M',
    hedgedPercent: 72,
    policyStatus: 'covered' satisfies PortalPolicyStatus,
    updatedAt: new Date().toISOString()
  }
};

export default meta;

type Story = StoryObj<typeof PortalExposureCard>;

export const Covered: Story = {};

export const Warning: Story = {
  args: {
    policyStatus: 'warning',
    hedgedPercent: 62,
    updatedLabel: '5 minutes ago'
  }
};

export const Critical: Story = {
  args: {
    policyStatus: 'critical',
    hedgedPercent: 38,
    netExposure: '$9.1M',
    updatedLabel: '15 minutes ago'
  }
};
