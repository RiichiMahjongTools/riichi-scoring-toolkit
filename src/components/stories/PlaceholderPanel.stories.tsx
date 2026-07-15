import { Calculator } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ActionButton, PlaceholderPanel } from '../index';

const meta = {
  title: 'Components/Feedback/PlaceholderPanel',
  component: PlaceholderPanel,
  args: {
    title: '功能暂未开放',
    description: '当前入口还没有可用内容。',
    statusLabel: 'Coming Soon',
    actions: <ActionButton icon={<Calculator aria-hidden="true" />}>返回快速算分</ActionButton>,
  },
} satisfies Meta<typeof PlaceholderPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
