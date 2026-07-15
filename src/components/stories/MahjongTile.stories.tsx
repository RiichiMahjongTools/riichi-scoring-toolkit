import type { Meta, StoryObj } from '@storybook/react-vite';

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
      {['m1', 'm9', 'p5r', 's3', 'z1', 'z5', 'z7', 'back'].map((code) => (
        <MahjongTile key={code} code={code} size="lg" />
      ))}
    </div>
  ),
};

export const Selected: Story = {
  args: {
    code: 'z7',
    marker: '和',
    selected: true,
  },
};
