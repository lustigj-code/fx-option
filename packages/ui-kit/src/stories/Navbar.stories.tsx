import type { Meta, StoryObj } from '@storybook/react';

import { Navbar } from '../components/Navbar';

const meta: Meta<typeof Navbar> = {
  title: 'Components/Navbar',
  component: Navbar,
  args: {
    logo: <span>Emerald Exchange</span>,
    links: [
      { label: 'Platform', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'Security', href: '#' },
      { label: 'Insights', href: '#' }
    ],
    ctaLabel: 'Launch app'
  }
};

export default meta;

type Story = StoryObj<typeof Navbar>;

export const Default: Story = {};
