import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { AppScreen } from '../../AppScreen';
import { assertFlatSurfaceHierarchy, createPageStoryArgs, expectNoPrimaryHeader, pageStoryParameters } from './storySupport';

const meta = {
  title: 'Pages/Practice',
  component: AppScreen,
  args: createPageStoryArgs(),
  parameters: pageStoryParameters,
} satisfies Meta<typeof AppScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chinitsu: Story = {
  args: { page: 'chinitsu' },
  play: async ({ canvasElement }) => {
    await expectNoPrimaryHeader(canvasElement);
    await expect(within(canvasElement).getByRole('region', { name: '清一色题面手牌' })).toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const ChinitsuFeedback: Story = {
  args: { page: 'chinitsu' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const choice = canvasElement.querySelector<HTMLButtonElement>('.mj-wait-tile-choice');
    await expect(choice).toBeInTheDocument();
    await userEvent.click(choice!);
    await userEvent.click(canvas.getByRole('button', { name: '提交答案' }));
    await expect(canvas.getByRole('heading', { name: /本题/ })).toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const FuPractice: Story = {
  args: { page: 'fu-practice' },
  play: async ({ canvasElement }) => {
    await expectNoPrimaryHeader(canvasElement);
    await expect(within(canvasElement).getByRole('group', { name: '选择最终符数' })).toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const FuPracticeFeedback: Story = {
  args: { page: 'fu-practice' },
  play: async ({ canvasElement }) => {
    const choice = canvasElement.querySelector<HTMLButtonElement>('.mj-fu-choice');
    await expect(choice).toBeInTheDocument();
    await userEvent.click(choice!);
    await expect(canvasElement.querySelector('.mj-fu-breakdown')).toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const PointPractice: Story = {
  args: { page: 'point-practice' },
  play: async ({ canvasElement }) => {
    await expectNoPrimaryHeader(canvasElement);
    await expect(within(canvasElement).getByRole('group', { name: '输入总获得点数' })).toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const PointPracticeFeedback: Story = {
  args: { page: 'point-practice' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText('例如 7700'), '1000');
    await userEvent.click(canvas.getByRole('button', { name: '提交答案' }));
    await expect(canvasElement.querySelector('.mj-practice-panel')).toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const Comeback: Story = {
  args: { page: 'comeback' },
  play: async ({ canvasElement }) => {
    await expectNoPrimaryHeader(canvasElement);
    await expect(within(canvasElement).getByLabelText('逆转所需番符作答')).toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const ComebackFeedback: Story = {
  args: { page: 'comeback' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const boardCount = canvasElement.querySelectorAll('.mj-comeback-board').length;
    for (let index = 0; index < boardCount; index += 1) {
      const board = canvasElement.querySelectorAll<HTMLElement>('.mj-comeback-board').item(index);
      const option = board.querySelector<HTMLButtonElement>('button:not([disabled])');
      await expect(option).toBeInTheDocument();
      await userEvent.click(option!);
    }
    await userEvent.click(canvas.getByRole('button', { name: '确认答案' }));
    await expect(canvasElement.querySelector('.mj-comeback-feedback')).toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};
