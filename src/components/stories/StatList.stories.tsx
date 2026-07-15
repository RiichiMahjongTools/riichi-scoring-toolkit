import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { StatList } from '../index';

const items = [
  { id: 'dealer-tsumo', label: '亲家自摸', value: '2600 all', caption: '3番40符', tone: 'success' as const },
  { id: 'dealer-ron', label: '亲家荣和', value: '7700', caption: '3番40符', tone: 'danger' as const },
  { id: 'child-tsumo', label: '闲家自摸', value: '1300 / 2600', caption: '3番40符', tone: 'warning' as const },
  { id: 'child-ron', label: '闲家荣和', value: '5200', caption: '3番40符', tone: 'success' as const },
];

const meta = {
  title: 'Components/Data Display/StatList',
  component: StatList,
  args: { items, dividers: 'none' },
  parameters: {
    a11y: { test: 'error' },
    mobileCanvas: true,
    docs: {
      description: {
        component: '适用于同一结果下的多项指标比较；默认依靠定义列表、对齐和间距，必要时显式启用行间线，不提供外围边框。',
      },
    },
  },
} satisfies Meta<typeof StatList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelectorAll('.mj-stat-list__item')).toHaveLength(4);
    await expect(canvas.getByText('亲家荣和').closest('.mj-stat-list__item')).toHaveClass('mj-stat-list__item--danger');
    await expect(canvas.getByText('5200')).toBeInTheDocument();
  },
};

export const WithDividers: Story = {
  args: {
    dividers: 'between',
  },
};
