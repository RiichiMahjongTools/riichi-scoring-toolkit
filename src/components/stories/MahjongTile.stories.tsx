import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { MahjongTile } from '../index';

const meta = {
  title: 'Components/Mahjong/MahjongTile',
  component: MahjongTile,
  args: {
    code: 'm5r',
    size: 'lg',
  },
} satisfies Meta<typeof MahjongTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RedFive: Story = {};

export const TileSet: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'end', gap: 6 }}>
      {['m1', 'm9', 'p5r', 's3', 'z1', 'z5', 'z7'].map((code) => (
        <MahjongTile key={code} code={code} size="lg" />
      ))}
      <MahjongTile ariaLabel="绿色牌背" code="m1" faceDown size="lg" />
    </div>
  ),
};

export const FaceDown: Story = {
  args: {
    ariaLabel: '绿色牌背',
    code: 'm1',
    faceDown: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tile = canvas.getByRole('img', { name: '绿色牌背' });
    await expect(tile).toHaveClass('mj-tile--face-down');
    await expect(tile.querySelector('img')).toHaveAttribute('src', '/tiles/fluffystuff/regular/Back-Green.png');
  },
};

export const TileBackCode: Story = {
  args: {
    code: 'back',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tile = canvas.getByRole('img', { name: '牌背' });
    const image = tile.querySelector('img');
    await expect(tile).toHaveClass('mj-tile--face-down');
    await expect(image).toHaveClass('mj-tile__back-img');
    await expect(image).toHaveAttribute('src', '/tiles/fluffystuff/regular/Back-Green.png');
    await expect(getComputedStyle(tile).borderTopWidth).toBe('0px');
    await expect(image?.getBoundingClientRect().width).toBe(tile.getBoundingClientRect().width);
    await expect(image?.getBoundingClientRect().height).toBe(tile.getBoundingClientRect().height);
  },
};

export const Selected: Story = {
  args: {
    code: 'z7',
    marker: '和',
    selected: true,
  },
};
