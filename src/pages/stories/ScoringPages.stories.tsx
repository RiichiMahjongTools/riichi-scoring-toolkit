import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';

import { AppScreen } from '../../AppScreen';
import { assertFlatSurfaceHierarchy, createPageStoryArgs, expectNoPrimaryHeader, pageStoryParameters } from './storySupport';

const meta = {
  title: 'Pages/Scoring',
  component: AppScreen,
  args: createPageStoryArgs(),
  parameters: pageStoryParameters,
  beforeEach: () => {
    sessionStorage.removeItem('mahjong.scoreDraft.quick.v1');
    sessionStorage.removeItem('mahjong.scoreDraft.legacy.v1');
  },
} satisfies Meta<typeof AppScreen>;

export default meta;
type Story = StoryObj<typeof meta>;
type StoryCanvas = ReturnType<typeof within>;

async function chooseQuickCandidate(
  canvas: StoryCanvas,
  suitName: string,
  tileName: string,
  candidateName: RegExp,
) {
  await userEvent.click(canvas.getByRole('button', { name: suitName }));
  const tile = canvas.getByRole('button', {
    name: `${tileName}，按住并上滑或按上方向键选择组合`,
  });
  fireEvent.pointerDown(tile, {
    button: 0,
    clientX: 100,
    clientY: 500,
    isPrimary: true,
    pointerId: 1,
  });
  const candidate = canvas.getByRole('option', { name: candidateName });
  if (candidate.getAttribute('aria-label')?.startsWith('暗杠：')) {
    const candidateGroup = candidate.querySelector('[data-meld-kind="closedKan"]');
    const candidateTiles = candidateGroup?.querySelectorAll('.mj-tile') ?? [];
    await expect(candidateTiles).toHaveLength(4);
    await expect(candidateTiles[0]).toHaveClass('mj-tile--face-down');
    await expect(candidateTiles[1]).not.toHaveClass('mj-tile--face-down');
    await expect(candidateTiles[2]).not.toHaveClass('mj-tile--face-down');
    await expect(candidateTiles[3]).toHaveClass('mj-tile--face-down');
  }
  if (candidate.getAttribute('aria-label')?.startsWith('明杠：')) {
    const candidateGroup = candidate.querySelector('[data-meld-kind="openKan"]');
    const candidateTiles = candidateGroup?.querySelectorAll('.mj-tile') ?? [];
    await expect(candidateTiles).toHaveLength(4);
    await expect(candidateGroup?.querySelector('.mj-meld-tile-group__called-tile')).toBe(candidateTiles[1]);
  }
  if (candidate.getAttribute('aria-label')?.startsWith('顺子：')) {
    const candidateGroup = candidate.querySelector('[data-meld-kind="chi"]');
    if (candidateGroup) {
      await expect(candidateGroup.querySelector('.mj-meld-tile-group__called-tile')).toBeNull();
    }
  }
  if (candidate.getAttribute('aria-label')?.startsWith('刻子：')) {
    const candidateGroup = candidate.querySelector('[data-meld-kind="pon"]');
    if (candidateGroup) {
      await expect(candidateGroup.querySelector('.mj-meld-tile-group__called-tile')).toBeNull();
    }
  }
  const rect = candidate.getBoundingClientRect();
  const selectionPoint = {
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    isPrimary: true,
    pointerId: 1,
  };
  fireEvent.pointerMove(tile, selectionPoint);
  fireEvent.pointerUp(tile, { ...selectionPoint, button: 0 });
  await userEvent.click(canvas.getByRole('button', { name: '完成' }));
}

async function addQuickMeld(
  canvas: StoryCanvas,
  suitName: string,
  tileName: string,
  candidateName: RegExp,
) {
  const emptySlot = canvas
    .getAllByRole('button', { name: /录入副露，第 \d+ 个占位/ })
    .find((button: HTMLElement) => !button.hasAttribute('disabled'));
  if (!emptySlot) throw new Error('没有可用的副露占位');
  await userEvent.click(emptySlot);
  await chooseQuickCandidate(canvas, suitName, tileName, candidateName);
}

export const HanFuCalculator: Story = {
  args: { page: 'han-fu-calculator' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expectNoPrimaryHeader(canvasElement);
    await expect(canvas.getByRole('group', { name: '选择番数与符数' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: '番符换算' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(canvas.getByRole('button', { name: '快速算分' }));
    await expect(args.onNavigate).toHaveBeenCalledWith('quick-score');
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const HanFuCalculatorFourHan: Story = {
  args: { page: 'han-fu-calculator' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fourHan = canvas.getByRole('button', { name: '4番' });
    await userEvent.click(fourHan);
    await expect(fourHan).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText('12000')).toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const QuickScore: Story = {
  args: { page: 'quick-score' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expectNoPrimaryHeader(canvasElement);
    await expect(canvas.getByText('-')).toHaveStyle({ fontWeight: '900' });
    await expect(canvas.getByRole('group', { name: '额外役与修正' })).toBeInTheDocument();
    await expect(canvas.getByText('0/14')).toBeInTheDocument();
    await expect(canvas.getByText('宝牌指示牌')).toBeInTheDocument();
    await expect(canvas.getByText('里宝牌指示牌')).toBeInTheDocument();
    await expect(canvas.getByText('副露')).toBeInTheDocument();
    const scoreNavigation = canvas.getByRole('navigation', { name: '算分功能' });
    await expect(within(scoreNavigation).queryByRole('button', { name: '古役' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: '手牌' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: '宝牌/里宝' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: '分享结果' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: '修改' })).not.toBeInTheDocument();
    const resultActions = canvasElement.querySelector<HTMLElement>('.mj-quick-result-actions');
    if (!resultActions) throw new Error('未找到计分结果操作区');
    await expect(within(resultActions).getAllByRole('button').map((button) => button.textContent)).toEqual([
      '古役模式',
      '清空',
    ]);
    await userEvent.click(within(resultActions).getByRole('button', { name: '古役模式' }));
    await expect(args.onNavigate).toHaveBeenCalledWith('legacy-score');
    await expect(canvasElement.querySelectorAll('.mj-quick-hand-strip .mj-tile--empty')).toHaveLength(14);
    await expect(canvasElement.querySelectorAll('.mj-indicator-entry-strip .mj-tile--empty')).toHaveLength(10);
    await expect(canvasElement.querySelectorAll('.mj-meld-entry-strip .mj-tile--empty')).toHaveLength(14);
    await expect(canvasElement.querySelector('.mj-quick-hand-strip .mj-tile--empty')).toHaveStyle({ borderStyle: 'dashed' });
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const QuickScoreEntryFlow: Story = {
  args: { page: 'quick-score' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: '录入第 1 张手牌' }));
    await expect(canvas.getByRole('dialog', { name: '录入手牌' })).toBeInTheDocument();
    await chooseQuickCandidate(canvas, '万子', '加入3万', /^顺子·赤五：/);
    await expect(canvas.getByRole('button', { name: '编辑手牌，当前 3/14' })).toBeInTheDocument();
    await expect(canvas.getByText('牌面未录完整')).toBeInTheDocument();
    await expect(canvas.getByText('还需录入 11 张')).toHaveClass('mj-score-hero__shanten');
    await expect(canvas.getByText('还需录入 11 张')).toHaveStyle({
      fontFamily: "'Noto Sans SC', system-ui, sans-serif",
      fontSize: '38px',
    });
    await expect(canvas.getByText('当前 3/14')).toBeInTheDocument();
    await expect(canvas.queryByText(/向听/)).not.toBeInTheDocument();
    await expect(canvas.queryByText(/有效牌/)).not.toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('.mj-score-hero')).toHaveLength(1);
    await expect(canvasElement.querySelector('.mj-surface-panel--info')).toBeNull();
    const incompleteHandTile = canvas.getByRole('button', { name: '编辑手牌（第 1 张3万）' });
    await userEvent.click(incompleteHandTile);
    const incompleteHandDialog = canvas.getByRole('dialog', { name: '录入手牌' });
    await expect(
      within(incompleteHandDialog).queryByRole('button', { name: '选择第 1 张3万为和牌' }),
    ).not.toBeInTheDocument();
    await userEvent.click(within(incompleteHandDialog).getByRole('button', { name: '关闭牌键盘' }));

    await userEvent.click(canvas.getByRole('button', { name: '录入第 1 张宝牌指示牌' }));
    await userEvent.click(canvas.getByRole('button', { name: '加入2万' }));
    await userEvent.click(canvas.getByRole('button', { name: '完成' }));
    await userEvent.click(canvas.getByRole('button', { name: '录入第 1 张里宝牌指示牌' }));
    await userEvent.click(canvas.getByRole('button', { name: '加入3万' }));
    await userEvent.click(canvas.getByRole('button', { name: '完成' }));
    await expect(canvas.getByRole('button', { name: '编辑宝牌指示牌中的2万' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: '编辑里宝牌指示牌中的3万' })).toBeInTheDocument();

    const riichi = canvas.getByRole('button', { name: '立直' });
    await userEvent.click(riichi);
    await expect(riichi).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(canvas.getByRole('button', { name: '录入副露，第 1 个占位' }));
    await chooseQuickCandidate(canvas, '筒子', '加入4筒', /^刻子：/);
    await expect(canvas.getByRole('button', { name: '编辑第 1 组副露（碰）' })).toBeInTheDocument();
    await expect(riichi).toBeDisabled();
    await expect(riichi).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.getByRole('button', { name: '两立直' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: '一发' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: '天和' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: '地和' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: '自摸' })).toBeEnabled();

    await userEvent.click(canvas.getByRole('button', { name: '编辑第 1 组副露（碰）' }));
    await expect(canvas.getByRole('dialog', { name: '编辑碰' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: '删除这组' }));
    await userEvent.click(canvas.getByRole('button', { name: '完成' }));
    await expect(canvas.queryByRole('button', { name: '编辑第 1 组副露（碰）' })).not.toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const QuickScoreHandShortcuts: Story = {
  args: { page: 'quick-score' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const openHandEditor = () => canvas.getByRole('button', { name: /^编辑手牌，当前 / });

    await userEvent.click(openHandEditor());
    await chooseQuickCandidate(canvas, '万子', '加入1万', /^顺子：/);
    await userEvent.click(openHandEditor());
    await chooseQuickCandidate(canvas, '筒子', '加入1筒', /^对子：/);
    await userEvent.click(openHandEditor());
    await chooseQuickCandidate(canvas, '索子', '加入1索', /^刻子：/);

    await expect(canvas.getByRole('button', { name: '编辑手牌，当前 8/14' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: /编辑第 \d+ 组副露/ })).not.toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const QuickScoreWinTileSelectionInEditor: Story = {
  args: { page: 'quick-score' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const openHandEditor = () => canvas.getByRole('button', { name: /^编辑手牌，当前 / });

    await userEvent.click(canvas.getByRole('button', { name: '录入第 1 张手牌' }));
    await chooseQuickCandidate(canvas, '万子', '加入1万', /^顺子：/);
    await userEvent.click(openHandEditor());
    await chooseQuickCandidate(canvas, '万子', '加入4万', /^顺子：/);
    await userEvent.click(openHandEditor());
    await chooseQuickCandidate(canvas, '万子', '加入7万', /^顺子：/);
    await userEvent.click(openHandEditor());
    await chooseQuickCandidate(canvas, '筒子', '加入1筒', /^对子：/);
    await userEvent.click(openHandEditor());
    await chooseQuickCandidate(canvas, '索子', '加入1索', /^刻子：/);

    await expect(canvas.getByRole('button', { name: '编辑手牌，当前 14/14' })).toBeInTheDocument();
    await expect(canvas.queryByText('牌面未录完整')).not.toBeInTheDocument();
    await expect(canvas.queryByText(/还需录入/)).not.toBeInTheDocument();
    await expect(canvas.getByText('最终点数')).toBeInTheDocument();
    const firstPageTile = canvas.getByRole('button', { name: '编辑手牌（第 1 张1万）' });
    await expect(firstPageTile).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(firstPageTile);

    const handDialog = canvas.getByRole('dialog', { name: '录入手牌' });
    const firstPreviewTile = within(handDialog).getByRole('button', { name: '选择第 1 张1万为和牌' });
    await expect(firstPreviewTile).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(firstPreviewTile);
    await expect(firstPreviewTile).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(within(handDialog).getByRole('button', { name: '完成' }));

    await expect(canvas.getByRole('button', { name: '编辑手牌（第 1 张1万）' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const QuickScoreMeldShortcutsAndExpansion: Story = {
  args: { page: 'quick-score' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const firstEmptySlot = canvas
      .getAllByRole('button', { name: /录入副露，第 \d+ 个占位/ })
      .find((button: HTMLElement) => !button.hasAttribute('disabled'));
    if (!firstEmptySlot) throw new Error('没有可用的副露占位');
    await userEvent.click(firstEmptySlot);
    const newMeldDialog = canvas.getByRole('dialog', { name: '录入副露' });
    const anchorTile = within(newMeldDialog).getByRole('button', {
      name: '加入1万，按住并上滑或按上方向键选择组合',
    });
    fireEvent.pointerDown(anchorTile, {
      button: 0,
      clientX: 100,
      clientY: 500,
      isPrimary: true,
      pointerId: 9,
    });
    fireEvent.pointerUp(anchorTile, {
      button: 0,
      clientX: 100,
      clientY: 500,
      isPrimary: true,
      pointerId: 9,
    });
    await expect(within(newMeldDialog).getByText('副露预览')).toBeInTheDocument();
    await expect(within(newMeldDialog).getByText('0/4')).toBeInTheDocument();
    await expect(
      newMeldDialog.querySelectorAll('.mj-keyboard-preview-strip .mj-tile:not(.mj-tile--empty)'),
    ).toHaveLength(0);
    await userEvent.click(within(newMeldDialog).getByRole('button', { name: '关闭牌键盘' }));

    await addQuickMeld(canvas, '万子', '加入1万', /^顺子：/);
    await addQuickMeld(canvas, '筒子', '加入2筒', /^刻子：/);
    await addQuickMeld(canvas, '索子', '加入3索', /^暗杠：/);
    await addQuickMeld(canvas, '字牌', '加入东', /^明杠：/);

    const chiGroup = canvas.getByRole('button', { name: '编辑第 1 组副露（吃）' });
    await expect(chiGroup.querySelector('.mj-meld-tile-group__called-tile')).toBeNull();
    await expect(canvas.getByRole('button', { name: '编辑第 2 组副露（碰）' })).toBeInTheDocument();
    const closedKanGroup = canvas.getByRole('button', { name: '编辑第 3 组副露（暗杠）' });
    const closedKanTiles = closedKanGroup.querySelectorAll('.mj-tile');
    await expect(closedKanTiles).toHaveLength(4);
    await expect(closedKanTiles[0]).toHaveClass('mj-tile--face-down');
    await expect(closedKanTiles[1]).not.toHaveClass('mj-tile--face-down');
    await expect(closedKanTiles[2]).not.toHaveClass('mj-tile--face-down');
    await expect(closedKanTiles[3]).toHaveClass('mj-tile--face-down');
    await expect(canvasElement.querySelectorAll('.mj-meld-entry-strip .mj-tile__back-img')).toHaveLength(2);
    await expect(
      [...canvasElement.querySelectorAll('.mj-meld-entry-strip .mj-tile__marker')].some(
        (marker) => marker.textContent === '暗',
      ),
    ).toBe(false);
    const openKanGroup = canvas.getByRole('button', { name: '编辑第 4 组副露（明杠）' });
    const openKanTiles = openKanGroup.querySelectorAll('.mj-tile');
    await expect(openKanTiles).toHaveLength(4);
    await expect(openKanGroup.querySelector('.mj-meld-tile-group__called-tile')).toBe(openKanTiles[1]);
    await expect(
      [...canvasElement.querySelectorAll('.mj-meld-entry-strip .mj-tile__marker')].some(
        (marker) => marker.textContent === '明',
      ),
    ).toBe(false);

    await userEvent.click(closedKanGroup);
    const closedKanDialog = canvas.getByRole('dialog', { name: '编辑暗杠' });
    const closedKanPreviewGroup = closedKanDialog.querySelector('[data-meld-kind="closedKan"]');
    const closedKanPreviewTiles = closedKanPreviewGroup?.querySelectorAll('.mj-tile') ?? [];
    await expect(closedKanPreviewTiles).toHaveLength(4);
    await expect(closedKanPreviewTiles[0]).toHaveClass('mj-tile--face-down');
    await expect(closedKanPreviewTiles[1]).not.toHaveClass('mj-tile--face-down');
    await expect(closedKanPreviewTiles[2]).not.toHaveClass('mj-tile--face-down');
    await expect(closedKanPreviewTiles[3]).toHaveClass('mj-tile--face-down');
    await expect(within(closedKanDialog).getByText('当前副露')).toBeInTheDocument();
    await userEvent.click(within(closedKanDialog).getByRole('button', { name: '关闭牌键盘' }));

    await userEvent.click(openKanGroup);
    const openKanDialog = canvas.getByRole('dialog', { name: '编辑明杠' });
    const openKanPreviewGroup = openKanDialog.querySelector('[data-meld-kind="openKan"]');
    const openKanPreviewTiles = openKanPreviewGroup?.querySelectorAll('.mj-tile') ?? [];
    await expect(openKanPreviewTiles).toHaveLength(4);
    await expect(openKanPreviewGroup?.querySelector('.mj-meld-tile-group__called-tile')).toBe(openKanPreviewTiles[1]);
    await userEvent.click(within(openKanDialog).getByRole('button', { name: '关闭牌键盘' }));

    await userEvent.click(chiGroup);
    const chiDialog = canvas.getByRole('dialog', { name: '编辑吃' });
    const chiPreviewGroup = chiDialog.querySelector('[data-meld-kind="chi"]');
    await expect(chiPreviewGroup?.querySelector('.mj-meld-tile-group__called-tile')).toBeNull();
    await expect(chiDialog.querySelectorAll('.mj-keyboard-preview-strip .mj-tile:not(.mj-tile--empty)')).toHaveLength(3);
    await expect(within(chiDialog).getByText('当前副露')).toBeInTheDocument();
    await chooseQuickCandidate(canvas, '万子', '加入4万', /^暗杠：/);
    await userEvent.click(canvas.getByRole('button', { name: '编辑第 2 组副露（碰）' }));
    await chooseQuickCandidate(canvas, '筒子', '加入5筒', /^明杠：/);

    await expect(canvasElement.querySelectorAll('.mj-meld-entry-strip .mj-tile')).toHaveLength(16);
    await expect(canvasElement.querySelectorAll('.mj-meld-entry-strip .mj-tile--empty')).toHaveLength(0);
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const QuickScoreSanmaHonba: Story = {
  args: { page: 'quick-score' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sanma = canvas.getByRole('button', { name: '三麻' });
    await userEvent.click(sanma);
    await userEvent.click(canvas.getByRole('button', { name: '增加本场数' }));
    await expect(sanma).toHaveAttribute('aria-pressed', 'true');
    await expect(canvasElement.querySelector('output.mj-counter__value')).toHaveTextContent('1');
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const QuickScoreLegacyModePreservesDraft: Story = {
  args: { page: 'quick-score' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '录入第 1 张手牌' }));
    await chooseQuickCandidate(canvas, '万子', '加入1万', /^顺子：/);
    await userEvent.click(canvas.getByRole('button', { name: '古役模式' }));
    await expect(args.onNavigate).toHaveBeenCalledWith('legacy-score');

    const storage = canvasElement.ownerDocument.defaultView?.sessionStorage;
    const legacyDraft = JSON.parse(storage?.getItem('mahjong.scoreDraft.legacy.v1') ?? '{}') as {
      handTiles?: string[];
    };
    await expect(legacyDraft.handTiles).toEqual(['m1', 'm2', 'm3']);
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const LegacyScore: Story = {
  args: { page: 'legacy-score' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expectNoPrimaryHeader(canvasElement);
    await expect(canvas.getByText('-')).toHaveStyle({ fontWeight: '900' });
    await expect(canvas.getByRole('group', { name: '额外役与修正' })).toBeInTheDocument();
    await expect(canvas.getByText('0/14')).toBeInTheDocument();
    const scoreNavigation = canvas.getByRole('navigation', { name: '算分功能' });
    await expect(within(scoreNavigation).queryByRole('button', { name: '古役' })).not.toBeInTheDocument();
    await expect(within(scoreNavigation).getByRole('button', { name: '快速算分' })).toHaveAttribute('aria-current', 'page');
    const legacyToggle = canvas.getByRole('button', { name: '古役模式' });
    await expect(legacyToggle).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(legacyToggle);
    await expect(args.onNavigate).toHaveBeenCalledWith('quick-score');
    await expect(canvasElement.querySelectorAll('.mj-quick-hand-strip .mj-tile--empty')).toHaveLength(14);
    await expect(canvasElement.querySelectorAll('.mj-indicator-entry-strip .mj-tile--empty')).toHaveLength(10);
    await expect(canvasElement.querySelectorAll('.mj-meld-entry-strip .mj-tile--empty')).toHaveLength(14);
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};

export const LegacyScoreEntryFlow: Story = {
  args: { page: 'legacy-score' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: '录入第 1 张宝牌指示牌' }));
    await userEvent.click(canvas.getByRole('button', { name: '加入2万' }));
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('button', { name: '编辑宝牌指示牌中的2万' })).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: '录入第 1 张宝牌指示牌' }));
    await userEvent.click(canvas.getByRole('button', { name: '加入2万' }));
    await userEvent.click(canvas.getByRole('button', { name: '完成' }));
    await expect(canvas.getByRole('button', { name: '编辑宝牌指示牌中的2万' })).toBeInTheDocument();

    const storage = canvasElement.ownerDocument.defaultView?.sessionStorage;
    await waitFor(() => {
      const saved = JSON.parse(storage?.getItem('mahjong.scoreDraft.legacy.v1') ?? '{}') as {
        doraIndicators?: string[];
      };
      expect(saved.doraIndicators).toEqual(['m2']);
    });

    await userEvent.click(canvas.getByRole('button', { name: '录入第 1 张手牌' }));
    await chooseQuickCandidate(canvas, '万子', '加入3万', /^顺子：/);
    await expect(canvas.getByRole('button', { name: '编辑手牌，当前 3/14' })).toBeInTheDocument();
    await expect(canvas.getByText('牌面未录完整')).toBeInTheDocument();
    await expect(canvas.getByText('还需录入 11 张')).toBeInTheDocument();
    await expect(canvas.queryByText(/向听/)).not.toBeInTheDocument();
    await expect(canvas.queryByText(/有效牌/)).not.toBeInTheDocument();
    await assertFlatSurfaceHierarchy(canvasElement);
  },
};
