import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from '../components/Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  args: {
    children: 'Innovative Product of the Year'
  }
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Accent: Story = {
  args: {
    tone: 'accent'
  }
};

export const Muted: Story = {
  args: {
    tone: 'muted',
    children: 'Best Financial App'
  }
};
