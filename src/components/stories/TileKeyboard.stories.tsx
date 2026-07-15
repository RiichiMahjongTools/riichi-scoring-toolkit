import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ActionButton, TileKeyboard } from '../index';

const initialTiles = ['m1', 'm2', 'm3', 'p4', 'p5r'];

function TileKeyboardExample() {
  const [tiles, setTiles] = useState(initialTiles);
  const [open, setOpen] = useState(true);

  return (
    <>
      {!open ? <ActionButton onClick={() => setOpen(true)}>重新打开牌键盘</ActionButton> : null}
      <TileKeyboard
        open={open}
        subtitle="选择最多 14 张牌，赤五可直接录入。"
        tiles={tiles}
        onChange={setTiles}
        onClose={() => setOpen(false)}
        onDone={() => setOpen(false)}
      />
    </>
  );
}

const meta = {
  title: 'Components/Mahjong/TileKeyboard',
  component: TileKeyboard,
  args: {
    open: true,
    tiles: initialTiles,
    onChange: () => undefined,
    onDone: () => undefined,
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TileKeyboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <TileKeyboardExample />,
};
