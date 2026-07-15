import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { AppScreen } from '../../AppScreen';
import { assertFlatSurfaceHierarchy, createPageStoryArgs, expectNoPrimaryHeader, pageStoryParameters } from './storySupport';

const meta = {
  title: 'Pages/Reference',
  component: AppScreen,
  args: createPageStoryArgs(),
  parameters: pageStoryParameters,
} satisfies Meta<typeof AppScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const YakuList: Story = {
  args: { page: 'yaku-list' },
  play: async ({ canvasElement }) => {
    await expectNoPrimaryHeader(canvasElement);
    await expect(within(canvasElement).getByLabelText('役种筛选')).toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const YakuListYakumanFilter: Story = {
  args: { page: 'yaku-list' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const yakuman = canvas.getByRole('button', { name: '役满' });
    await userEvent.click(yakuman);
    await expect(yakuman).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('heading', { name: '役满' })).toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const HanFuTable: Story = {
  args: { page: 'han-fu-table' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectNoPrimaryHeader(canvasElement);
    await expect(canvas.getByRole('table')).toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const FuHelp: Story = {
  args: { page: 'help-fu' },
  play: async ({ canvasElement }) => {
    await expectNoPrimaryHeader(canvasElement);
    await expect(within(canvasElement).getByRole('heading', { name: '计算顺序' })).toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const PointHelp: Story = {
  args: { page: 'help-points' },
  play: async ({ canvasElement }) => {
    await expectNoPrimaryHeader(canvasElement);
    await expect(within(canvasElement).getByRole('heading', { name: '点数计算步骤' })).toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};
