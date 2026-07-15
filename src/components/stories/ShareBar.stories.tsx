import { Clipboard, Copy, RotateCcw, Share2, SlidersHorizontal } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { ShareBar } from '../index';

const meta = {
  title: 'Components/Panels/ShareBar',
  component: ShareBar,
  args: {
    actions: [
      { id: 'clear', label: '清空', icon: <RotateCcw aria-hidden="true" />, onClick: fn(), variant: 'ghost' },
      { id: 'modify', label: '修改', icon: <SlidersHorizontal aria-hidden="true" />, onClick: fn(), variant: 'ghost' },
      { id: 'share-result', label: '分享结果', icon: <Share2 aria-hidden="true" />, onClick: fn(), disabled: true, variant: 'primary' },
    ],
    appearance: 'plain',
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

export const Panel: Story = {
  args: {
    actions: [
      { id: 'copy-result', label: '复制结果', icon: <Copy aria-hidden="true" />, onClick: fn() },
      { id: 'save-image', label: '保存图片', icon: <Clipboard aria-hidden="true" />, onClick: fn() },
      { id: 'share', label: '分享', icon: <Share2 aria-hidden="true" />, onClick: fn(), variant: 'primary' },
    ],
    appearance: 'panel',
    label: '分享与保存',
    size: 'sm',
  },
};
