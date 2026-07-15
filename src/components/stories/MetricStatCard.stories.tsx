import type { Meta, StoryObj } from '@storybook/react-vite';

import { MetricStatCard } from '../index';

const meta = {
  title: 'Components/Data Display/MetricStatCard',
  component: MetricStatCard,
  args: {
    label: '总点数',
    value: '7,700',
    caption: '子家荣和',
    tone: 'success',
  },
} satisfies Meta<typeof MetricStatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
