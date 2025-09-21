import type { Meta, StoryObj } from '@storybook/react';

import { PortalHedgePlaybookCard } from '../../components/portal/PortalHedgePlaybookCard';

const meta: Meta<typeof PortalHedgePlaybookCard> = {
  title: 'Portal/HedgePlaybookCard',
  component: PortalHedgePlaybookCard,
  args: {
    title: 'Asia Pacific Quarterly Ladder',
    description: 'Executes 6 tranches against APAC exposures with VaR guardrails and alerts for threshold breaches.',
    coverage: 68,
    drift: -1.8,
    alerts: 1,
    nextAction: new Date(Date.now() + 3600 * 1000).toISOString()
  }
};

export default meta;

type Story = StoryObj<typeof PortalHedgePlaybookCard>;

export const Default: Story = {};

export const Healthy: Story = {
  args: {
    coverage: 82,
    drift: 0.2,
    alerts: 0,
    nextActionLabel: 'Execution window closes in 2 hours'
  }
};

export const Escalated: Story = {
  args: {
    coverage: 47,
    drift: 3.6,
    alerts: 4,
    nextActionLabel: 'Awaiting compliance sign-off'
  }
};
