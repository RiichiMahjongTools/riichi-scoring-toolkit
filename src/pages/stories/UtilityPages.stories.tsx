import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { AppScreen } from '../../AppScreen';
import { createPageStoryArgs, expectPageTitle, pageStoryParameters } from './storySupport';

const meta = {
  title: 'Pages/Utility',
  component: AppScreen,
  args: createPageStoryArgs(),
  parameters: pageStoryParameters,
} satisfies Meta<typeof AppScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Contact: Story = {
  args: { page: 'contact' },
  play: async ({ canvasElement }) => {
    await expectPageTitle(canvasElement, '联系反馈');
    await expect(within(canvasElement).getByLabelText('反馈内容')).toBeInTheDocument();
  },
};

export const ContactSubmitted: Story = {
  args: { page: 'contact' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('反馈内容'), 'Storybook 页面状态测试');
    await userEvent.click(canvas.getByRole('button', { name: '提交反馈' }));
    await expect(canvas.getByRole('heading', { name: '已记录' })).toBeInTheDocument();
  },
};

export const TileKeyboardDemo: Story = {
  args: { page: 'tile-keyboard-demo' },
  play: async ({ canvasElement }) => {
    await expectPageTitle(canvasElement, '牌输入键盘');
    await expect(within(canvasElement).getByRole('region', { name: '牌输入键盘' })).toBeInTheDocument();
  },
};

export const TileKeyboardWithTiles: Story = {
  args: { page: 'tile-keyboard-demo' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '1万' }));
    await userEvent.click(canvas.getByRole('button', { name: '2万' }));
    await expect(canvas.getByRole('heading', { name: '选择手牌 2/14' })).toBeInTheDocument();
  },
};

export const Placeholder: Story = {
  args: { page: 'placeholder' },
  play: async ({ canvasElement }) => {
    await expectPageTitle(canvasElement, '页面不可用');
    await expect(within(canvasElement).getByRole('heading', { name: '没有匹配的页面' })).toBeInTheDocument();
  },
};
