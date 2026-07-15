import { Settings, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { IconButton } from '../index';

const meta = {
  title: 'Components/Controls/IconButton',
  component: IconButton,
  args: {
    ariaLabel: '打开设置',
    icon: <Settings aria-hidden="true" />,
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Danger: Story = {
  args: {
    ariaLabel: '删除',
    icon: <Trash2 aria-hidden="true" />,
    variant: 'danger',
  },
};
