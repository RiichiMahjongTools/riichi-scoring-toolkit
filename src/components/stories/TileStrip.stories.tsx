import type { Meta, StoryObj } from '@storybook/react-vite';

import { TileStrip } from '../index';

const hand = ['m1', 'm2', 'm3', 'm4', 'm5r', 'm6', 'p2', 'p3', 'p4', 's6', 's7', 's8', 'z7', 'z7'];

const meta = {
  title: 'Components/Mahjong/TileStrip',
  component: TileStrip,
  args: {
    label: '手牌',
    tiles: hand,
    highlightLast: true,
    maxSlots: 14,
  },
} satisfies Meta<typeof TileStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CompleteHand: Story = {};

export const Empty: Story = {
  args: {
    emptyLabel: '点击添加手牌',
    tiles: [],
  },
};
