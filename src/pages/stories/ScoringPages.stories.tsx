import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { AppScreen } from '../../AppScreen';
import { assertFlatSurfaceHierarchy, createPageStoryArgs, expectNoPrimaryHeader, pageStoryParameters } from './storySupport';

const meta = {
  title: 'Pages/Scoring',
  component: AppScreen,
  args: createPageStoryArgs(),
  parameters: pageStoryParameters,
  beforeEach: () => {
    sessionStorage.removeItem('mahjong.scoreDraft.quick.v1');
    sessionStorage.removeItem('mahjong.scoreDraft.legacy.v1');
  },
} satisfies Meta<typeof AppScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HanFuCalculator: Story = {
  args: { page: 'han-fu-calculator' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expectNoPrimaryHeader(canvasElement);
    await expect(canvas.getByRole('group', { name: '选择番数与符数' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: '番符换算' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(canvas.getByRole('button', { name: '快速算分' }));
    await expect(args.onNavigate).toHaveBeenCalledWith('quick-score');
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const HanFuCalculatorFourHan: Story = {
  args: { page: 'han-fu-calculator' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fourHan = canvas.getByRole('button', { name: '4番' });
    await userEvent.click(fourHan);
    await expect(fourHan).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText('12000')).toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const QuickScore: Story = {
  args: { page: 'quick-score' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectNoPrimaryHeader(canvasElement);
    await expect(canvas.getByText('-')).toHaveStyle({ fontWeight: '900' });
    await expect(canvas.getByRole('group', { name: '额外役与修正' })).toBeInTheDocument();
    await expect(canvas.getByText('0/14')).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('.mj-quick-hand-group .mj-tile--empty')).toHaveLength(14);
    await expect(canvasElement.querySelector('.mj-quick-hand-group .mj-tile--empty')).toHaveStyle({ borderStyle: 'dashed' });
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const QuickScoreSanmaHonba: Story = {
  args: { page: 'quick-score' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sanma = canvas.getByRole('button', { name: '三麻' });
    await userEvent.click(sanma);
    await userEvent.click(canvas.getByRole('button', { name: '增加本场数' }));
    await expect(sanma).toHaveAttribute('aria-pressed', 'true');
    await expect(canvasElement.querySelector('output.mj-counter__value')).toHaveTextContent('1');
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const LegacyScore: Story = {
  args: { page: 'legacy-score' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectNoPrimaryHeader(canvasElement);
    await expect(canvas.getByText('-')).toHaveStyle({ fontWeight: '900' });
    await expect(canvas.getByRole('group', { name: '额外役与修正' })).toBeInTheDocument();
    await expect(canvas.getByText('0/14')).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('.mj-quick-hand-group .mj-tile--empty')).toHaveLength(14);
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};
