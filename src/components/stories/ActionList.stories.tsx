import { Github, Mail, RotateCcw } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { ActionList } from '../index';

const retry = fn();

const meta = {
  title: 'Components/Navigation/ActionList',
  component: ActionList,
  args: {
    items: [
      { id: 'mail', kind: 'link', title: '电子邮件', meta: 'feedback@example.com', href: 'mailto:feedback@example.com', icon: <Mail aria-hidden="true" /> },
      { id: 'retry', kind: 'button', title: '重新识别', description: '使用当前照片再次运行', onClick: retry, icon: <RotateCcw aria-hidden="true" /> },
      { id: 'github', kind: 'static', title: 'GitHub', meta: '暂未开放', icon: <Github aria-hidden="true" /> },
    ],
    dividers: 'none',
  },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component: '适用于连续的链接、按钮或只读信息行；默认依靠间距，密集多行列表可显式启用内缩行间线，不提供外围边框。',
      },
    },
  },
} satisfies Meta<typeof ActionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MixedItems: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: /电子邮件/ })).toHaveAttribute('href', 'mailto:feedback@example.com');
    await userEvent.click(canvas.getByRole('button', { name: /重新识别/ }));
    await expect(retry).toHaveBeenCalledOnce();
  },
};

export const InsetDividers: Story = {
  args: {
    dividers: 'between',
  },
};
