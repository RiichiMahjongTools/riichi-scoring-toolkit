import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, within } from 'storybook/test';

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

function TileKeyboardQuickExample() {
  const [tiles, setTiles] = useState<string[]>([]);
  const [open, setOpen] = useState(true);
  return (
    <>
      {!open ? <ActionButton onClick={() => setOpen(true)}>重新打开牌键盘</ActionButton> : null}
      <TileKeyboard
        open={open}
        previewLabel="当前手牌"
        tiles={tiles}
        title="录入手牌"
        getQuickActions={(tile) =>
          tile === 'm1'
            ? [
                { id: 'sequence', label: '顺子', tiles: ['m1', 'm2', 'm3'] },
                { id: 'pair', label: '对子', tiles: ['m1', 'm1'] },
                { id: 'triplet', label: '刻子', tiles: ['m1', 'm1', 'm1'] },
              ]
            : tile === 'm3'
            ? [
                { id: 'sequence', label: '顺子', tiles: ['m3', 'm4', 'm5'] },
                { id: 'red-sequence', label: '顺子·赤五', tiles: ['m3', 'm4', 'm5r'] },
                { id: 'pair', label: '对子', tiles: ['m3', 'm3'] },
                { id: 'triplet', label: '刻子', tiles: ['m3', 'm3', 'm3'] },
              ]
            : []
        }
        onChange={setTiles}
        onClose={() => setOpen(false)}
        onDone={() => setOpen(false)}
        onQuickAction={(action) => setTiles(action.tiles)}
      />
    </>
  );
}

function TileKeyboardMeldExample() {
  const [tiles, setTiles] = useState(['m3', 'm3', 'm3', 'm3']);
  return (
    <TileKeyboard
      maxTiles={4}
      open
      previewLabel="当前副露"
      previewMeldKind="closedKan"
      previewReadOnly
      quickActionOnly
      replaceTilesOnInput
      tiles={tiles}
      title="编辑暗杠"
      getQuickActions={(tile) =>
        tile === 'm3'
          ? [
              {
                id: 'closed-kan',
                label: '暗杠',
                tiles: ['m3', 'm3', 'm3', 'm3'],
                meldKind: 'closedKan',
              },
              {
                id: 'open-kan',
                label: '明杠',
                tiles: ['m3', 'm3', 'm3', 'm3'],
                meldKind: 'openKan',
              },
            ]
          : []
      }
      onChange={setTiles}
      onDone={() => undefined}
      onQuickAction={(action) => setTiles(action.tiles)}
    />
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByLabelText('牌面选择');
    const tileLabels = [...grid.querySelectorAll('button')].map((button) => button.getAttribute('aria-label'));
    await expect(tileLabels).toEqual([
      '加入1万',
      '加入2万',
      '加入3万',
      '加入4万',
      '加入5万',
      '加入6万',
      '加入7万',
      '加入8万',
      '加入9万',
      '加入赤5万',
    ]);
  },
};

export const WithQuickActions: Story = {
  render: () => <TileKeyboardQuickExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstTile = canvas.getByRole('button', {
      name: '加入1万，按住并上滑或按上方向键选择组合',
    });
    fireEvent.pointerDown(firstTile, { button: 0, clientX: 40, clientY: 500, isPrimary: true, pointerId: 1 });
    const anchoredPicker = canvas.getByRole('listbox', { name: '1万的组合选择' });
    const firstTileRect = firstTile.getBoundingClientRect();
    const anchoredPickerRect = anchoredPicker.getBoundingClientRect();
    const candidateTileRect = anchoredPicker.querySelector('.mj-tile')?.getBoundingClientRect();
    const anchorOffset = Math.abs(
      firstTileRect.left + firstTileRect.width / 2 - (anchoredPickerRect.left + anchoredPickerRect.width / 2),
    );
    await expect(anchorOffset).toBeLessThan(1);
    await expect(getComputedStyle(anchoredPicker).gap).toBe('4px');
    await expect(candidateTileRect?.width).toBe(18);
    await expect(candidateTileRect?.height).toBe(27);
    fireEvent.pointerCancel(firstTile, { isPrimary: true, pointerId: 1 });

    const tile = canvas.getByRole('button', {
      name: '加入3万，按住并上滑或按上方向键选择组合',
    });
    fireEvent.pointerDown(tile, { button: 0, clientX: 100, clientY: 500, isPrimary: true, pointerId: 1 });
    const picker = canvas.getByRole('listbox', { name: '3万的组合选择' });
    await expect(picker).toBeInTheDocument();
    await expect(canvas.queryByText('顺子')).not.toBeInTheDocument();
    await expect(canvas.queryByRole('option', { name: /暗杠|明杠/ })).not.toBeInTheDocument();

    const option = canvas.getByRole('option', { name: '顺子·赤五：3万、4万、赤5万' });
    const rect = option.getBoundingClientRect();
    const coords = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, pointerId: 1 };
    fireEvent.pointerMove(tile, coords);
    fireEvent.pointerUp(tile, { ...coords, button: 0, isPrimary: true });
    await expect(canvas.queryByRole('listbox', { name: '3万的组合选择' })).not.toBeInTheDocument();
    await expect(canvas.getByText('3/14')).toBeInTheDocument();

    tile.focus();
    fireEvent.keyDown(tile, { key: 'ArrowUp' });
    fireEvent.keyDown(tile, { key: 'ArrowRight' });
    fireEvent.keyDown(tile, { key: 'ArrowRight' });
    await expect(canvas.getByRole('option', { name: '对子：3万、3万' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(tile, { key: 'Enter' });
    await expect(canvas.queryByRole('listbox', { name: '3万的组合选择' })).not.toBeInTheDocument();
    await expect(canvas.getByText('2/14')).toBeInTheDocument();
  },
};

export const WithMeldQuickActions: Story = {
  render: () => <TileKeyboardMeldExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previewGroup = canvasElement.querySelector('[data-meld-kind="closedKan"]');
    const previewTiles = previewGroup?.querySelectorAll('.mj-tile') ?? [];
    await expect(previewTiles).toHaveLength(4);
    await expect(previewTiles[0]).toHaveClass('mj-tile--face-down');
    await expect(previewTiles[1]).not.toHaveClass('mj-tile--face-down');
    await expect(previewTiles[2]).not.toHaveClass('mj-tile--face-down');
    await expect(previewTiles[3]).toHaveClass('mj-tile--face-down');

    const tile = canvas.getByRole('button', {
      name: '加入3万，按住并上滑或按上方向键选择组合',
    });
    await expect(tile).toBeEnabled();
    fireEvent.pointerDown(tile, { button: 0, clientX: 100, clientY: 500, isPrimary: true, pointerId: 1 });
    const option = canvas.getByRole('option', { name: '暗杠：3万、3万、3万、3万' });
    const candidateTiles = option.querySelectorAll('.mj-tile');
    await expect(candidateTiles).toHaveLength(4);
    await expect(candidateTiles[0]).toHaveClass('mj-tile--face-down');
    await expect(candidateTiles[1]).not.toHaveClass('mj-tile--face-down');
    await expect(candidateTiles[2]).not.toHaveClass('mj-tile--face-down');
    await expect(candidateTiles[3]).toHaveClass('mj-tile--face-down');

    const openKanOption = canvas.getByRole('option', { name: '明杠：3万、3万、3万、3万' });
    const openKanGroup = openKanOption.querySelector('[data-meld-kind="openKan"]');
    const openKanTiles = openKanGroup?.querySelectorAll('.mj-tile') ?? [];
    await expect(openKanTiles).toHaveLength(4);
    await expect(openKanGroup?.querySelector('.mj-meld-tile-group__called-tile')).toBe(openKanTiles[1]);
    fireEvent.pointerCancel(tile, { isPrimary: true, pointerId: 1 });

    fireEvent.pointerDown(tile, { button: 0, clientX: 100, clientY: 500, isPrimary: true, pointerId: 2 });
    fireEvent.pointerUp(tile, { button: 0, clientX: 100, clientY: 500, isPrimary: true, pointerId: 2 });
    await expect(previewGroup?.querySelectorAll('.mj-tile')).toHaveLength(4);
  },
};
