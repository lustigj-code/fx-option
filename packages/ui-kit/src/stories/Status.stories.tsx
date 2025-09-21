import type { Meta, StoryObj } from '@storybook/react';
import { StatusBanner, StatusCard, StatusSkeleton } from '../status';

const meta: Meta<typeof StatusCard> = {
  title: 'Status/Card',
  component: StatusCard,
  args: {
    title: 'Gateway offline',
    subtitle: 'We are retrying the connection and will update you shortly.',
    tone: 'critical',
  },
};

export default meta;

type Story = StoryObj<typeof StatusCard>;

export const CriticalAlert: Story = {
  render: (args) => (
    <StatusCard {...args}>
      <StatusBanner tone="critical">Gateway unavailable — retrying</StatusBanner>
    </StatusCard>
  ),
};

export const LoadingState: Story = {
  args: {
    title: 'Connecting to pricing gateway',
    subtitle: 'Fetching the latest market snapshot.',
    tone: 'info',
  },
  render: (args) => (
    <StatusCard {...args}>
      <StatusSkeleton tone="info" lines={4} />
    </StatusCard>
  ),
};
