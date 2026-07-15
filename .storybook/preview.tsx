import type { Preview } from '@storybook/react-vite';

import '../src/styles.css';

const mobileCanvasStyle = {
  width: 'min(390px, 100%)',
  minHeight: '100vh',
  margin: '0 auto',
} as const;

const preview: Preview = {
  tags: ['autodocs'],
  decorators: [
    (Story, context) => (
      context.parameters.mobileCanvas
        ? <div style={mobileCanvasStyle}><Story /></div>
        : <Story />
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    layout: 'padded',
  },
};

export default preview;
