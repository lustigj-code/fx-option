import type { Meta, StoryObj } from '@storybook/react';
import { ArrowRight } from 'lucide-react';

import { Button } from '../components/Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: (
      <>
        Explore <ArrowRight className="h-4 w-4" />
      </>
    )
  }
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary'
  }
};

export const Ghost: Story = {
  args: {
    variant: 'ghost'
  }
};
