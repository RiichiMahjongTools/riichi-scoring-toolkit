import { MoreHorizontal, Share2 } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TopNav } from '../index';

const meta = {
  title: 'Components/Layout/TopNav',
  component: TopNav,
  args: {
    title: '算分',
    subtitle: undefined,
    onBack: undefined,
    actions: [
      { label: '分享', icon: <Share2 aria-hidden="true" />, onClick: () => undefined },
      { label: '更多', icon: <MoreHorizontal aria-hidden="true" />, onClick: () => undefined },
    ],
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TopNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TitleOnly: Story = {
  args: {
    title: '联系反馈',
    subtitle: undefined,
    onBack: () => undefined,
    actions: [],
  },
};
