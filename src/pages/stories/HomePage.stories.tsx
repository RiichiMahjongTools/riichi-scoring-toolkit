import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { AppScreen } from '../../AppScreen';
import { createPageStoryArgs, expectPageTitle, pageStoryParameters } from './storySupport';

const meta = {
  title: 'Pages/Home',
  component: AppScreen,
  args: createPageStoryArgs(),
  parameters: pageStoryParameters,
} satisfies Meta<typeof AppScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { page: 'home' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectPageTitle(canvasElement, '日麻点数');
    await expect(canvas.getByRole('heading', { name: '计分' })).toBeInTheDocument();
  },
};

export const ContactSheetOpen: Story = {
  args: { page: 'home' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '联系我 / 反馈' }));
    await expect(canvas.getByRole('dialog', { name: '联系我' })).toBeInTheDocument();
  },
};
