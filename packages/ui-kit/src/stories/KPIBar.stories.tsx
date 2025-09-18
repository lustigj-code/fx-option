import type { Meta, StoryObj } from '@storybook/react';

import { KPIBar } from '../components/KPIBar';

const meta: Meta<typeof KPIBar> = {
  title: 'Components/KPIBar',
  component: KPIBar,
  args: {
    label: 'Revenue goal',
    value: 82,
    target: 100
  }
};

export default meta;

type Story = StoryObj<typeof KPIBar>;

export const Default: Story = {};
