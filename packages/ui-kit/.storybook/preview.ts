import type { Preview } from '@storybook/react';

import '../src/styles.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'night',
      values: [
        {
          name: 'night',
          value: '#0b0f0c'
        }
      ]
    },
    layout: 'centered'
  }
};

export default preview;
