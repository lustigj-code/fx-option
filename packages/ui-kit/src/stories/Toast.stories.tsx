import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../components/Button';
import { Toast } from '../components/Toast';

const meta: Meta<typeof Toast> = {
  title: 'Feedback/Toast',
  component: Toast,
  args: {
    title: 'Rate lock confirmed',
    description: 'EUR · USD · 1.0821 held for the next 24 hours.',
    status: 'success',
    action: <Button size="sm">View details</Button>
  }
};

export default meta;

type Story = StoryObj<typeof Toast>;

export const Default: Story = {};
