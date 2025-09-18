import type { Meta, StoryObj } from '@storybook/react';

import { Card } from '../components/Card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  args: {
    header: 'Transaction',
    children: (
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted">Amount</span>
          <span className="text-text">$12,480.00</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Status</span>
          <span className="text-accent">Cleared</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Timestamp</span>
          <span className="text-text">Jan 04 · 14:32</span>
        </div>
      </div>
    ),
    footer: 'Processed securely via Emerald Engine'
  }
};

export default meta;

type Story = StoryObj<typeof Card>;

export const GlassTransactionCard: Story = {};
