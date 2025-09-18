import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../components/Button';
import { Form } from '../components/Form';

const meta: Meta<typeof Form> = {
  title: 'Components/Form',
  component: Form,
  args: {
    title: 'Schedule a strategy session',
    description: 'Our FX strategists respond within 12 hours.',
    submitLabel: 'Book consultation',
    fields: [
      { label: 'Name', name: 'name', placeholder: 'Aisha Malik' },
      { label: 'Company email', name: 'email', type: 'email', placeholder: 'aisha@emerald.com' },
      {
        label: 'Monthly volume',
        name: 'volume',
        placeholder: '$250K - $500K',
        helperText: 'Used to tailor liquidity bands.'
      }
    ],
    children: <Button variant="ghost">Share brief</Button>
  }
};

export default meta;

type Story = StoryObj<typeof Form>;

export const Default: Story = {};
