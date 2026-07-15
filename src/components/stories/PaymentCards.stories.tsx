import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { PaymentCards } from '../index';

const meta = {
  title: 'Components/Data Display/PaymentCards',
  component: PaymentCards,
  args: {
    items: [
      { id: 'dealer-tsumo', label: '亲家自摸', value: '2600 all', caption: '3番40符', tone: 'success' },
      { id: 'dealer-ron', label: '亲家荣和', value: '7700', caption: '3番40符', tone: 'danger' },
      { id: 'child-tsumo', label: '闲家自摸', value: '1300 / 2600', caption: '3番40符', tone: 'warning' },
      { id: 'child-ron', label: '闲家荣和', value: '5200', caption: '3番40符', tone: 'success' },
    ],
  },
  parameters: { mobileCanvas: true },
} satisfies Meta<typeof PaymentCards>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cards = canvasElement.querySelectorAll('.mj-metric-card');

    await expect(cards).toHaveLength(4);
    await expect(canvas.getByText('亲家荣和').closest('.mj-metric-card')).toHaveClass('mj-metric-card--danger');
    await expect(canvas.getByText('闲家自摸').closest('.mj-metric-card')).toHaveClass('mj-metric-card--warning');
    await expect(canvas.getByText('5200')).toBeInTheDocument();
  },
};
