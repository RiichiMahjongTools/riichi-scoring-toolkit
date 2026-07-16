import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { TileStrip } from '../index';

const hand = ['m1', 'm2', 'm3', 'm4', 'm5r', 'm6', 'p2', 'p3', 'p4', 's6', 's7', 's8', 'z7', 'z7'];

function InteractiveSlotExample() {
  const [tiles, setTiles] = useState<string[]>([]);
  return (
    <TileStrip
      aria-label="交互牌槽"
      emptyLabel={null}
      emptySlotActionLabel={(index) => `录入第 ${index + 1} 张测试牌`}
      maxSlots={4}
      tileSize="xs"
      tiles={tiles}
      onEmptySlotClick={() => setTiles((current) => [...current, 'm1'])}
    />
  );
}

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

export const InteractiveSlots: Story = {
  render: () => <InteractiveSlotExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '录入第 1 张测试牌' }));
    await expect(canvas.getByRole('img', { name: '1万' })).toBeInTheDocument();
    await expect(canvas.getAllByRole('button', { name: /录入第 .* 张测试牌/ })).toHaveLength(3);
  },
};

export const DisabledEmptySlots: Story = {
  args: {
    emptyLabel: null,
    emptySlotActionLabel: (index) => `已禁用第 ${index + 1} 个副露占位`,
    emptySlotsDisabled: true,
    maxSlots: 14,
    tiles: Array.from({ length: 12 }, (_, index) => `p${(index % 9) + 1}`),
    onEmptySlotClick: () => undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emptySlots = canvas.getAllByRole('button', { name: /已禁用第 .* 个副露占位/ });
    await expect(emptySlots).toHaveLength(2);
    await expect(emptySlots[0]).toBeDisabled();
    await expect(emptySlots[1]).toBeDisabled();
  },
};
