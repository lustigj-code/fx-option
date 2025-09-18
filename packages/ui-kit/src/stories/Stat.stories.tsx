import type { Meta, StoryObj } from '@storybook/react';

import { Stat } from '../components/Stat';

const meta: Meta<typeof Stat> = {
  title: 'Components/Stat',
  component: Stat,
  args: {
    label: 'Active users',
    value: '248K',
    trend: {
      direction: 'up',
      value: '12.4%'
    }
  }
};

export default meta;

type Story = StoryObj<typeof Stat>;

export const Default: Story = {};
