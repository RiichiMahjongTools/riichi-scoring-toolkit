import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { MeldTileGroup } from '../index';

const meta = {
  title: 'Components/Mahjong/MeldTileGroup',
  component: MeldTileGroup,
  args: {
    kind: 'openKan',
    size: 'sm',
    tiles: ['p6', 'p6', 'p6', 'p6'],
  },
} satisfies Meta<typeof MeldTileGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenKan: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('img', { name: '明杠：6筒、6筒、6筒、6筒' });
    const tiles = [...group.querySelectorAll<HTMLElement>('.mj-tile')];
    const calledTile = group.querySelector<HTMLElement>('.mj-meld-tile-group__called-tile');
    await expect(tiles).toHaveLength(4);
    await expect(calledTile).toBe(tiles[1]);

    const rects = tiles.map((tile) => tile.getBoundingClientRect());
    await expect(Math.abs(rects[0].bottom - rects[1].bottom)).toBeLessThan(1);
    await expect(Math.abs(rects[2].bottom - rects[1].bottom)).toBeLessThan(1);
    await expect(rects[0].right).toBeLessThanOrEqual(rects[1].left + 0.5);
    await expect(rects[1].right).toBeLessThanOrEqual(rects[2].left + 0.5);
  },
};

export const Chi: Story = {
  args: {
    kind: 'chi',
    tiles: ['m3', 'm4', 'm5r'],
  },
};

export const Pon: Story = {
  args: {
    kind: 'pon',
    tiles: ['z1', 'z1', 'z1'],
  },
};

export const ClosedKan: Story = {
  args: {
    kind: 'closedKan',
    tiles: ['s4', 's4', 's4', 's4'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('img', { name: '暗杠：4索、4索、4索、4索' });
    await expect(group.querySelectorAll('.mj-tile--face-down')).toHaveLength(2);
    await expect(group.querySelector('.mj-meld-tile-group__called-tile')).not.toBeInTheDocument();
  },
};

export const AddedKan: Story = {
  args: {
    kind: 'addedKan',
    tiles: ['m5r', 'm5', 'm5', 'm5'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('img', { name: '加杠：赤5万、5万、5万、5万' });
    const calledSlot = group.querySelector('.mj-meld-tile-group__slot--added');
    await expect(group.querySelectorAll('.mj-tile')).toHaveLength(4);
    await expect(calledSlot?.querySelectorAll('.mj-meld-tile-group__called-tile')).toHaveLength(2);
  },
};

export const CalledTilePositions: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <MeldTileGroup calledTileIndex={0} kind="pon" size="sm" tiles={['p3', 'p3', 'p3']} />
      <MeldTileGroup calledTileIndex={1} kind="pon" size="sm" tiles={['p4', 'p4', 'p4']} />
      <MeldTileGroup calledTileIndex={2} kind="pon" size="sm" tiles={['p5', 'p5', 'p5']} />
    </div>
  ),
};
