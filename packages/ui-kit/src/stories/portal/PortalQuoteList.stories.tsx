import type { Meta, StoryObj } from '@storybook/react';

import {
  PortalQuoteList,
  type PortalQuoteListProps
} from '../../components/portal/PortalQuoteList';

const meta: Meta<typeof PortalQuoteList> = {
  title: 'Portal/QuoteList',
  component: PortalQuoteList,
  args: {
    currencyPair: 'GBP / SGD',
    offers: [
      {
        dealer: 'Dealer Alpha',
        midRate: 1.8123,
        spreadBps: 12.4,
        validUntil: new Date(Date.now() + 60 * 1000).toISOString(),
        best: true
      },
      {
        dealer: 'Dealer Bravo',
        midRate: 1.8129,
        spreadBps: 14.2,
        validUntil: new Date(Date.now() + 90 * 1000).toISOString()
      },
      {
        dealer: 'Dealer Charlie',
        midRate: 1.8135,
        spreadBps: 18.6,
        validUntil: new Date(Date.now() + 120 * 1000).toISOString()
      }
    ] satisfies PortalQuoteListProps['offers']
  }
};

export default meta;

type Story = StoryObj<typeof PortalQuoteList>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    offers: [],
    emptyState: 'Start a quote request to populate dealer responses.'
  }
};
