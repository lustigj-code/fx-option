import type { Meta, StoryObj } from '@storybook/react';

import { TestimonialStrip } from '../components/TestimonialStrip';

const meta: Meta<typeof TestimonialStrip> = {
  title: 'Sections/TestimonialStrip',
  component: TestimonialStrip,
  args: {
    testimonials: [
      {
        quote: 'Emerald automates reconciliation so our treasury team can focus on strategy.',
        author: 'Lena Carter',
        role: 'CFO · Stratospace'
      },
      {
        quote: 'We ship global payouts 4x faster with Emerald’s compliance guardrails.',
        author: 'Darius Patel',
        role: 'Head of Ops · Flowly'
      },
      {
        quote: 'The predictive hedging signals are eerily accurate in volatile markets.',
        author: 'Mika Chen',
        role: 'VP of Finance · NovaTrade'
      }
    ]
  }
};

export default meta;

type Story = StoryObj<typeof TestimonialStrip>;

export const Default: Story = {};
