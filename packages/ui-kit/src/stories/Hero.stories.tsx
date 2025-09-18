import type { Meta, StoryObj } from '@storybook/react';

import { Card } from '../components/Card';
import { Hero } from '../components/Hero';

const meta: Meta<typeof Hero> = {
  title: 'Sections/Hero',
  component: Hero,
  args: {
    headline: 'Grow FX operations with luminous precision.',
    subheadline:
      'Emerald unifies currency risk, liquidity, and compliance into one adaptive operating system so your teams can scale with certainty.',
    badges: ['Innovative Product of the Year', 'Best Financial App'],
    primaryCta: {
      label: 'Request demo'
    },
    secondaryCta: {
      label: 'View pricing'
    },
    media: (
      <Card
        header="Live transaction"
        footer="Secured by quantum-grade encryption"
        className="max-w-sm"
      >
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Beneficiary</span>
            <span className="text-text">Aurora Ventures</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Amount</span>
            <span className="text-text">€4,800.00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">FX rate lock</span>
            <span className="text-accent">1.0821</span>
          </div>
        </div>
      </Card>
    )
  }
};

export default meta;

type Story = StoryObj<typeof Hero>;

export const Default: Story = {};
