import { RotateCcw, Share2, SlidersHorizontal } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { ShareBar } from '../index';

const meta = {
  title: 'Components/Actions/ShareBar',
  component: ShareBar,
  args: {
    actions: [
      { id: 'clear', label: '清空', icon: <RotateCcw aria-hidden="true" />, onClick: fn(), variant: 'ghost' },
      { id: 'modify', label: '修改', icon: <SlidersHorizontal aria-hidden="true" />, onClick: fn(), variant: 'ghost' },
      { id: 'share-result', label: '分享结果', icon: <Share2 aria-hidden="true" />, onClick: fn(), disabled: true, variant: 'primary' },
    ],
    label: null,
    size: 'md',
  },
  parameters: { mobileCanvas: true },
} satisfies Meta<typeof ShareBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '清空' }));
    await expect(args.actions[0].onClick).toHaveBeenCalledOnce();
    await expect(canvas.getByRole('button', { name: '分享结果' })).toBeDisabled();
  },
};
