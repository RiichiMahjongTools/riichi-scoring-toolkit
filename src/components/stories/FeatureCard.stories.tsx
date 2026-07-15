import { Calculator } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { FeatureCard } from '../index';

const meta = {
  title: 'Components/Data Display/FeatureCard',
  component: FeatureCard,
  args: {
    title: '快速点数计算',
    description: '录入手牌、和牌方式与场况，得到番符和最终点数。',
    meta: '支持四麻与三麻',
    badge: '常用',
    icon: <Calculator aria-hidden="true" />,
  },
} satisfies Meta<typeof FeatureCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Success: Story = {
  args: { tone: 'success', badge: '已完成' },
};
