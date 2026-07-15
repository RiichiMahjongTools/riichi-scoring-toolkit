import { Home, Share2 } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TopNav } from '../index';

const meta = {
  title: 'Components/Layout/TopNav',
  component: TopNav,
  args: {
    title: '快速点数计算',
    subtitle: '东风战 · 亲家',
    backLabel: '返回首页',
    onBack: () => undefined,
    actions: [
      { label: '首页', icon: <Home aria-hidden="true" />, onClick: () => undefined },
      { label: '分享', icon: <Share2 aria-hidden="true" />, onClick: () => undefined, variant: 'surface' },
    ],
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TopNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TitleOnly: Story = {
  args: {
    subtitle: undefined,
    onBack: undefined,
    actions: [],
  },
};
