import { History, RotateCcw } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { ShareBar } from '../index';

const meta = {
  title: 'Components/Actions/ShareBar',
  component: ShareBar,
  args: {
    actions: [
      { id: 'legacy-mode', label: '古役模式', icon: <History aria-hidden="true" />, onClick: fn(), ariaPressed: false, variant: 'ghost' },
      { id: 'clear', label: '清空', icon: <RotateCcw aria-hidden="true" />, onClick: fn(), variant: 'ghost' },
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
    await userEvent.click(canvas.getByRole('button', { name: '古役模式' }));
    await expect(args.actions[0].onClick).toHaveBeenCalledOnce();
    await expect(canvas.getByRole('button', { name: '古役模式' })).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.queryByRole('button', { name: '分享结果' })).not.toBeInTheDocument();
  },
};
