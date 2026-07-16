import { AlertCircle, Camera, History, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import {
  ActionButton,
  Alert,
  Chip,
  CounterControl,
  FieldGroup,
  MahjongTile,
  MeldTileGroup,
  ShareBar,
  SurfacePanel,
  TileKeyboard,
  TileStrip,
  type QuickTileAction,
} from '../components';
import {
  DEFAULT_SCORE_CONDITIONS,
  buildQuickEntryCandidates,
  calculateScoreOrEfficiency,
  canUseTileCodes,
  createMeldInput,
  expectedClosedTileCount,
  getMeldKind,
  isTileCode,
  parseTileCodes,
  tileToCode,
  type MeldInput,
  type MeldKind,
  type QuickEntryCandidate,
  type ScoreComputation,
  type ScoreConditions,
  type ScoreMode,
  type TileCode,
  type Wind,
} from '../domain';
import {
  WIND_LABELS,
  formatFu,
  formatHan,
  formatLimit,
  formatPoints,
  formatShanten,
} from './shared';
import {
  applyScoreDraftTileImport,
  clearScoreDraft,
  loadScoreDraft,
  saveScoreDraft,
  type ScoreDraftV1,
} from './scoreDraft';

type KeyboardTarget = 'hand' | 'dora' | 'ura' | 'meld';
type QuickComputation =
  | ScoreComputation
  | { kind: 'empty' }
  | { kind: 'incomplete'; current: number; expected: number; missing: number };
type ScorePageVariant = 'quick' | 'legacy';
type ScorePageTarget = 'quick-score' | 'legacy-score';

interface ScoreCalculatorPageProps {
  onNavigate?: (page: ScorePageTarget) => void;
}

const MELD_KIND_LABELS: Record<MeldKind, string> = {
  chi: '吃',
  pon: '碰',
  openKan: '明杠',
  closedKan: '暗杠',
  addedKan: '加杠',
};

interface EntryDraft {
  target: KeyboardTarget;
  handTiles: TileCode[];
  winTileIndex: number | null;
  melds: MeldInput[];
  doraIndicators: TileCode[];
  uraDoraIndicators: TileCode[];
  editingMeldIndex: number | null;
  meldPreviewTiles: TileCode[];
}

type EntrySlotStyle = CSSProperties & {
  '--mj-entry-slot-count': number;
  '--mj-entry-strip-max-width': string;
};

const WIND_OPTIONS: Array<{ value: Wind; label: string }> = [
  { value: 'east', label: '东' },
  { value: 'south', label: '南' },
  { value: 'west', label: '西' },
  { value: 'north', label: '北' },
];

const NORTH_DORA_OPTIONS = [0, 1, 2, 3, 4] as const;

const COMMON_EXTRA_OPTIONS: Array<{ key: keyof ScoreConditions; label: string }> = [
  { key: 'riichi', label: '立直' },
  { key: 'tsumo', label: '自摸' },
];

const EXTRA_OPTIONS: Array<{ key: keyof ScoreConditions; label: string }> = [
  { key: 'doubleRiichi', label: '两立直' },
  { key: 'ippatsu', label: '一发' },
  { key: 'rinshan', label: '岭上' },
  { key: 'haiteiOrHoutei', label: '河/海底' },
  { key: 'chankan', label: '抢杠' },
  { key: 'tenhou', label: '天和' },
  { key: 'chiihou', label: '地和' },
];

const LEGACY_EVENT_OPTIONS: Array<{ key: keyof ScoreConditions; label: string; note: string }> = [
  { key: 'renhou', label: '人和', note: '子家第一次摸牌前荣和，按 5 番' },
  { key: 'tsubameGaeshi', label: '燕返', note: '门前荣和他家的立直宣言牌，按 1 番' },
  { key: 'kanfuri', label: '杠振', note: '荣和他家杠后摸岭上牌再打出的牌，按 1 番' },
];

function disabledConditionsForMelds(melds: readonly MeldInput[]): Set<keyof ScoreConditions> {
  const disabled = new Set<keyof ScoreConditions>();
  if (melds.length > 0) {
    disabled.add('tenhou');
    disabled.add('chiihou');
    disabled.add('renhou');
  }
  if (melds.some((meld) => meld.opened)) {
    disabled.add('doubleRiichi');
    disabled.add('riichi');
    disabled.add('ippatsu');
    disabled.add('tsubameGaeshi');
  }
  return disabled;
}

function sanitizeConditionsForMelds(
  conditions: ScoreConditions,
  melds: readonly MeldInput[],
): ScoreConditions {
  const disabled = disabledConditionsForMelds(melds);
  const invalidSelected = [...disabled].filter((key) => conditions[key]);
  if (invalidSelected.length === 0) return conditions;

  const next = { ...conditions };
  invalidSelected.forEach((key) => {
    next[key] = false;
  });
  return next;
}

function toTileCodes(values: string[]): TileCode[] {
  return values.filter(isTileCode);
}

export function parseQuickScoreTileImport(hash: string): TileCode[] {
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return [];

  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  const rawTiles = params.get('tiles');
  if (!rawTiles) return [];

  return rawTiles.split(/[,\s]+/).filter(isTileCode).slice(0, 14);
}

export function removeQuickScoreTileImport(hash: string): string {
  const fragment = hash.replace(/^#\/?/, '');
  const queryIndex = fragment.indexOf('?');
  if (queryIndex === -1) return hash;
  const page = fragment.slice(0, queryIndex);
  const params = new URLSearchParams(fragment.slice(queryIndex + 1));
  params.delete('tiles');
  const query = params.toString();
  return `#/${page}${query ? `?${query}` : ''}`;
}

function entrySlotStyle(slotCount: number): EntrySlotStyle {
  const normalizedCount = Math.max(1, slotCount);
  return {
    '--mj-entry-slot-count': normalizedCount,
    '--mj-entry-strip-max-width': `${normalizedCount * 22 - 2}px`,
  };
}

function removeAt<T>(values: readonly T[], index: number): T[] {
  return values.filter((_, currentIndex) => currentIndex !== index);
}

function normalizeWinTileIndex(length: number, expectedLength: number, index: number | null): number | null {
  if (length === 0 || length !== expectedLength) return null;
  if (index === null) return length - 1;
  return Math.min(Math.max(index, 0), length - 1);
}

export function QuickScorePage({ onNavigate }: ScoreCalculatorPageProps = {}) {
  return <ScoreCalculatorPage variant="quick" onNavigate={onNavigate} />;
}

export function LegacyScorePage({ onNavigate }: ScoreCalculatorPageProps = {}) {
  return <ScoreCalculatorPage variant="legacy" onNavigate={onNavigate} />;
}

function ScoreCalculatorPage({ variant, onNavigate }: ScoreCalculatorPageProps & { variant: ScorePageVariant }) {
  const isLegacy = variant === 'legacy';
  const [initialDraft] = useState(() => {
    const savedDraft = loadScoreDraft(variant);
    if (typeof window === 'undefined') return savedDraft;
    return applyScoreDraftTileImport(savedDraft, parseQuickScoreTileImport(window.location.hash));
  });
  const [mode, setMode] = useState<ScoreMode>(initialDraft.mode);
  const [handTiles, setHandTiles] = useState<TileCode[]>(initialDraft.handTiles);
  const [winTileIndex, setWinTileIndex] = useState<number | null>(initialDraft.winTileIndex);
  const [melds, setMelds] = useState<MeldInput[]>(
    initialDraft.melds.map((meld) => createMeldInput(meld.kind, parseTileCodes(meld.tiles))),
  );
  const [doraIndicators, setDoraIndicators] = useState<TileCode[]>(initialDraft.doraIndicators);
  const [uraDoraIndicators, setUraDoraIndicators] = useState<TileCode[]>(initialDraft.uraDoraIndicators);
  const [roundWind, setRoundWind] = useState<Wind>(initialDraft.roundWind);
  const [seatWind, setSeatWind] = useState<Wind>(initialDraft.seatWind);
  const [honba, setHonba] = useState(initialDraft.honba);
  const [northDoraCount, setNorthDoraCount] = useState<0 | 1 | 2 | 3 | 4>(initialDraft.northDoraCount);
  const [doubleWindPairTwoFu, setDoubleWindPairTwoFu] = useState(initialDraft.doubleWindPairTwoFu);
  const [conditions, setConditions] = useState<ScoreConditions>(() =>
    sanitizeConditionsForMelds({ ...initialDraft.conditions }, melds),
  );
  const [entryDraft, setEntryDraft] = useState<EntryDraft | null>(null);
  const [copyMessage, setCopyMessage] = useState('');
  const expectedClosedTiles = expectedClosedTileCount(melds.length);
  const selectedHandWinTileIndex = normalizeWinTileIndex(handTiles.length, expectedClosedTiles, winTileIndex);
  const disabledConditions = disabledConditionsForMelds(melds);

  useEffect(() => {
    const applyImportedTiles = () => {
      const importedTiles = parseQuickScoreTileImport(window.location.hash);
      const canonicalHash = removeQuickScoreTileImport(window.location.hash);
      if (importedTiles.length > 0) {
        setHandTiles(importedTiles);
        setWinTileIndex(importedTiles.length - 1);
        setCopyMessage('已带入识别手牌，请确认和牌张/最后摸切张');
      }
      if (canonicalHash !== window.location.hash) {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}${canonicalHash}`,
        );
      }
    };

    applyImportedTiles();
    window.addEventListener('hashchange', applyImportedTiles);
    return () => window.removeEventListener('hashchange', applyImportedTiles);
  }, []);

  useEffect(() => {
    const draft: ScoreDraftV1 = {
      version: 1,
      mode,
      handTiles,
      winTileIndex,
      melds: melds.map((meld) => ({
        kind: getMeldKind(meld),
        tiles: meld.tiles.map(tileToCode),
      })),
      doraIndicators,
      uraDoraIndicators,
      roundWind,
      seatWind,
      honba,
      northDoraCount,
      doubleWindPairTwoFu,
      conditions,
    };
    saveScoreDraft(variant, draft);
  }, [
    conditions,
    doraIndicators,
    doubleWindPairTwoFu,
    handTiles,
    honba,
    melds,
    mode,
    northDoraCount,
    roundWind,
    seatWind,
    uraDoraIndicators,
    variant,
    winTileIndex,
  ]);

  const computation = useMemo<QuickComputation>(() => {
    if (handTiles.length === 0) return { kind: 'empty' };
    if (handTiles.length < expectedClosedTiles) {
      return {
        kind: 'incomplete',
        current: handTiles.length,
        expected: expectedClosedTiles,
        missing: expectedClosedTiles - handTiles.length,
      };
    }

    try {
      const parsedHandTiles = parseTileCodes(handTiles);
      return calculateScoreOrEfficiency(
        {
          mode,
          handTiles: parsedHandTiles,
          winTile: selectedHandWinTileIndex === null ? null : parsedHandTiles[selectedHandWinTileIndex],
          melds,
          doraIndicators: parseTileCodes(doraIndicators),
          uraDoraIndicators: parseTileCodes(uraDoraIndicators),
          northDoraCount,
          roundWind,
          seatWind,
          honba,
          doubleWindPairTwoFu,
          conditions,
        },
        { enableLegacyYaku: isLegacy },
      );
    } catch (error) {
      return {
        kind: 'invalid',
        errors: [error instanceof Error ? error.message : '计算引擎返回异常，请调整手牌后重试'],
        warnings: [],
      };
    }
  }, [
    conditions,
    doraIndicators,
    doubleWindPairTwoFu,
    expectedClosedTiles,
    honba,
    melds,
    mode,
    northDoraCount,
    roundWind,
    handTiles,
    selectedHandWinTileIndex,
    seatWind,
    uraDoraIndicators,
    isLegacy,
  ]);

  const openEntryEditor = (target: KeyboardTarget, requestedMeldIndex: number | null = null) => {
    const editingMeldIndex =
      target === 'meld' && requestedMeldIndex !== null && melds[requestedMeldIndex]
        ? requestedMeldIndex
        : null;
    const editingMeld = editingMeldIndex === null ? null : melds[editingMeldIndex];

    setEntryDraft({
      target,
      handTiles: [...handTiles],
      winTileIndex,
      melds: [...melds],
      doraIndicators: [...doraIndicators],
      uraDoraIndicators: [...uraDoraIndicators],
      editingMeldIndex,
      meldPreviewTiles: editingMeld ? editingMeld.tiles.map(tileToCode) : [],
    });
  };

  const getQuickEntryCandidates = (tile: string): QuickEntryCandidate[] => {
    if (!entryDraft || !isTileCode(tile) || (entryDraft.target !== 'hand' && entryDraft.target !== 'meld')) return [];
    if (entryDraft.target === 'hand') {
      const inventory = [
        ...entryDraft.handTiles,
        ...entryDraft.melds.flatMap((meld) => meld.tiles.map(tileToCode)),
        ...entryDraft.doraIndicators,
        ...entryDraft.uraDoraIndicators,
      ];
      return buildQuickEntryCandidates({
        target: 'hand',
        anchor: tile,
        mode,
        inventory,
        handTileCount: entryDraft.handTiles.length,
        meldCount: entryDraft.melds.length,
      });
    }

    const inventory = [
      ...entryDraft.handTiles,
      ...entryDraft.melds.flatMap((meld, index) =>
        index === entryDraft.editingMeldIndex ? [] : meld.tiles.map(tileToCode),
      ),
      ...entryDraft.doraIndicators,
      ...entryDraft.uraDoraIndicators,
    ];
    return buildQuickEntryCandidates({
      target: 'meld',
      anchor: tile,
      mode,
      inventory,
      handTileCount: entryDraft.handTiles.length,
      meldCount: entryDraft.melds.length,
      replacingMeld: entryDraft.editingMeldIndex !== null,
    });
  };

  const getQuickTileActions = (tile: string): QuickTileAction[] =>
    getQuickEntryCandidates(tile).map((candidate) => ({
      id: candidate.id,
      label: candidate.label,
      tiles: candidate.tiles,
      meldKind: candidate.meldKind,
      calledTileIndex:
        candidate.meldKind === 'chi' || candidate.meldKind === 'pon' ? null : undefined,
    }));

  const keyboardTiles = entryDraft
    ? entryDraft.target === 'dora'
      ? entryDraft.doraIndicators
      : entryDraft.target === 'ura'
        ? entryDraft.uraDoraIndicators
        : entryDraft.target === 'meld'
          ? entryDraft.meldPreviewTiles
          : entryDraft.handTiles
    : [];

  const setKeyboardTiles = (tiles: string[]) => {
    const next = toTileCodes(tiles);
    setEntryDraft((current) => {
      if (!current) return current;
      if (current.target === 'dora') return { ...current, doraIndicators: next };
      if (current.target === 'ura') return { ...current, uraDoraIndicators: next };
      if (current.target === 'meld') return current;

      const previousLength = current.handTiles.length;
      const expected = expectedClosedTileCount(current.melds.length);
      const nextWinTileIndex =
        next.length !== expected
          ? null
          : next.length !== previousLength || current.winTileIndex === null
            ? next.length - 1
            : Math.min(current.winTileIndex, next.length - 1);
      return {
        ...current,
        handTiles: next,
        winTileIndex: nextWinTileIndex,
      };
    });
  };

  const editorBaseInventory = (draft: EntryDraft): TileCode[] => {
    if (draft.target === 'hand') {
      return [
        ...draft.melds.flatMap((meld) => meld.tiles.map(tileToCode)),
        ...draft.doraIndicators,
        ...draft.uraDoraIndicators,
      ];
    }
    if (draft.target === 'dora') {
      return [
        ...draft.handTiles,
        ...draft.melds.flatMap((meld) => meld.tiles.map(tileToCode)),
        ...draft.uraDoraIndicators,
      ];
    }
    if (draft.target === 'ura') {
      return [
        ...draft.handTiles,
        ...draft.melds.flatMap((meld) => meld.tiles.map(tileToCode)),
        ...draft.doraIndicators,
      ];
    }
    return [
      ...draft.handTiles,
      ...draft.melds.flatMap((meld, index) =>
        index === draft.editingMeldIndex ? [] : meld.tiles.map(tileToCode),
      ),
      ...draft.doraIndicators,
      ...draft.uraDoraIndicators,
    ];
  };

  const isEditorTileDisabled = (tile: string, currentTiles: string[]) => {
    if (!entryDraft || !isTileCode(tile)) return true;
    if (entryDraft.target === 'meld' && entryDraft.editingMeldIndex === null && entryDraft.melds.length >= 4) {
      return true;
    }
    const additions = entryDraft.target === 'meld' ? [tile] : [...toTileCodes(currentTiles), tile];
    return !canUseTileCodes(editorBaseInventory(entryDraft), additions, mode);
  };

  const applyQuickEntryCandidate = (actionId: string, tile: string) => {
    const candidate = getQuickEntryCandidates(tile).find((item) => item.id === actionId);
    if (!candidate) return;

    setEntryDraft((current) => {
      if (!current) return current;
      if (current.target === 'hand') {
        if (candidate.destination !== 'hand') return current;
        const nextHand = [...current.handTiles, ...candidate.tiles];
        const nextExpected = expectedClosedTileCount(current.melds.length);
        return {
          ...current,
          handTiles: nextHand,
          winTileIndex: normalizeWinTileIndex(nextHand.length, nextExpected, null),
        };
      }

      if (current.target !== 'meld' || !candidate.meldKind) return current;
      const nextMeld = createMeldInput(candidate.meldKind, parseTileCodes(candidate.tiles));
      const nextMelds = [...current.melds];
      const nextEditingMeldIndex = current.editingMeldIndex ?? nextMelds.length;
      if (current.editingMeldIndex === null) nextMelds.push(nextMeld);
      else nextMelds[nextEditingMeldIndex] = nextMeld;
      return {
        ...current,
        melds: nextMelds,
        editingMeldIndex: nextEditingMeldIndex,
        meldPreviewTiles: [...candidate.tiles],
      };
    });
  };

  const deleteMeldEditorSelection = () => {
    setEntryDraft((current) => {
      if (!current || current.target !== 'meld') return current;
      const nextMelds =
        current.editingMeldIndex === null ? current.melds : removeAt(current.melds, current.editingMeldIndex);
      return {
        ...current,
        melds: nextMelds,
        editingMeldIndex: null,
        meldPreviewTiles: [],
      };
    });
  };

  const commitEntryDraft = () => {
    if (!entryDraft) return;
    const expected = expectedClosedTileCount(entryDraft.melds.length);
    setHandTiles(entryDraft.handTiles);
    setWinTileIndex(normalizeWinTileIndex(entryDraft.handTiles.length, expected, entryDraft.winTileIndex));
    setMelds(entryDraft.melds);
    setConditions((current) => sanitizeConditionsForMelds(current, entryDraft.melds));
    setDoraIndicators(entryDraft.doraIndicators);
    setUraDoraIndicators(entryDraft.uraDoraIndicators);
    setEntryDraft(null);
  };

  const selectDraftWinTileIndex = (index: number) => {
    setEntryDraft((current) => {
      if (!current || current.target !== 'hand' || current.handTiles[index] === undefined) return current;
      return { ...current, winTileIndex: index };
    });
  };

  const selectMode = (nextMode: ScoreMode) => {
    setMode(nextMode);
    if (nextMode === 'yonma') setNorthDoraCount(0);
  };

  const reset = () => {
    clearScoreDraft(variant);
    setMode('yonma');
    setHandTiles([]);
    setWinTileIndex(null);
    setMelds([]);
    setDoraIndicators([]);
    setUraDoraIndicators([]);
    setRoundWind('east');
    setSeatWind('south');
    setHonba(0);
    setNorthDoraCount(0);
    setDoubleWindPairTwoFu(false);
    setConditions({ ...DEFAULT_SCORE_CONDITIONS });
    setEntryDraft(null);
    setCopyMessage('');
  };

  const toggleCondition = (key: keyof ScoreConditions) => {
    if (disabledConditions.has(key)) return;
    setConditions((value) => ({ ...value, [key]: !value[key] }));
  };

  const toggleLegacyMode = () => {
    const targetVariant: ScorePageVariant = isLegacy ? 'quick' : 'legacy';
    const targetPage: ScorePageTarget = isLegacy ? 'quick-score' : 'legacy-score';
    saveScoreDraft(targetVariant, {
      version: 1,
      mode,
      handTiles,
      winTileIndex,
      melds: melds.map((meld) => ({
        kind: getMeldKind(meld),
        tiles: meld.tiles.map(tileToCode),
      })),
      doraIndicators,
      uraDoraIndicators,
      roundWind,
      seatWind,
      honba,
      northDoraCount,
      doubleWindPairTwoFu,
      conditions,
    });
    if (onNavigate) onNavigate(targetPage);
    else window.location.hash = `#/${targetPage}`;
  };

  const openHandRecognition = () => {
    window.location.hash = `#/hand-recognition?return=${isLegacy ? 'legacy-score' : 'quick-score'}`;
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const noYakuWarnings = computation.kind === 'score' && !computation.result.valid ? computation.result.warnings : [];
  const invalidErrors = computation.kind === 'invalid' ? computation.errors : [];
  const quickActions = [
    {
      id: 'legacy-mode',
      label: '古役模式',
      icon: <History aria-hidden="true" />,
      ariaPressed: isLegacy,
      variant: isLegacy ? 'primary' as const : 'ghost' as const,
      onClick: toggleLegacyMode,
    },
    {
      id: 'reset',
      label: '清空',
      icon: <RotateCcw aria-hidden="true" />,
      variant: 'ghost' as const,
      onClick: reset,
    },
  ];

  const meldTileCount = melds.reduce((total, meld) => total + meld.tiles.length, 0);
  const meldSlotCount = Math.max(14, meldTileCount);
  const meldEmptySlotCount = meldSlotCount - meldTileCount;
  const draftExpectedClosedTiles = entryDraft ? expectedClosedTileCount(entryDraft.melds.length) : expectedClosedTiles;
  const draftSelectedWinTileIndex =
    entryDraft?.target === 'hand'
      ? normalizeWinTileIndex(entryDraft.handTiles.length, draftExpectedClosedTiles, entryDraft.winTileIndex)
      : null;
  const canSelectDraftWinTile =
    entryDraft?.target === 'hand' && entryDraft.handTiles.length === draftExpectedClosedTiles;
  const editingMeld =
    entryDraft?.target === 'meld' && entryDraft.editingMeldIndex !== null
      ? entryDraft.melds[entryDraft.editingMeldIndex]
      : undefined;
  const editingMeldKind = editingMeld ? getMeldKind(editingMeld) : null;
  const editingMeldExpectedTileCount =
    editingMeldKind === 'openKan' || editingMeldKind === 'closedKan' || editingMeldKind === 'addedKan' ? 4 : 3;
  const keyboardTitle =
    entryDraft?.target === 'hand'
      ? '录入手牌'
      : entryDraft?.target === 'dora'
        ? '录入宝牌指示牌'
        : entryDraft?.target === 'ura'
          ? '录入里宝牌指示牌'
          : editingMeldKind
            ? `编辑${MELD_KIND_LABELS[editingMeldKind]}`
            : '录入副露';
  const keyboardSubtitle =
    entryDraft?.target === 'hand'
      ? undefined
      : entryDraft?.target === 'dora'
        ? '最多录入 5 张宝牌指示牌。'
        : entryDraft?.target === 'ura'
          ? '最多录入 5 张里宝牌指示牌。'
          : undefined;
  const keyboardPreviewLabel =
    entryDraft?.target === 'hand'
      ? '当前手牌'
      : entryDraft?.target === 'dora'
        ? '宝牌指示牌'
      : entryDraft?.target === 'ura'
          ? '里宝牌指示牌'
          : entryDraft?.editingMeldIndex !== null
            ? '当前副露'
            : '副露预览';

  return (
    <div className={isLegacy ? 'mj-page-stack mj-quick-page mj-legacy-page' : 'mj-page-stack mj-quick-page'}>
      <QuickScorePanel computation={computation} seatWind={seatWind} />

      <FieldGroup className="mj-quick-hand-group" density="compact" legend="牌面录入" legendVisibility="sr-only">
        <div className="mj-quick-entry-layout">
          <div className="mj-entry-block mj-hand-entry-block">
            <button
              aria-label={`编辑手牌，当前 ${handTiles.length}/${expectedClosedTiles}`}
              className="mj-quick-count-action"
              type="button"
              onClick={() => openEntryEditor('hand')}
            >
              {handTiles.length}/{expectedClosedTiles}
            </button>
            <TileStrip
              aria-label="当前手牌与和牌张/最后摸切张"
              className="mj-entry-slot-strip mj-quick-hand-strip"
              emptyLabel={null}
              emptySlotActionLabel={(index) => `录入第 ${index + 1} 张手牌`}
              highlightIndex={selectedHandWinTileIndex}
              maxSlots={expectedClosedTiles}
              role="group"
              style={entrySlotStyle(Math.max(expectedClosedTiles, handTiles.length))}
              tileActionLabel={(index, tileLabel) => `编辑手牌（第 ${index + 1} 张${tileLabel}）`}
              tileSize="xs"
              tiles={handTiles}
              onEmptySlotClick={() => openEntryEditor('hand')}
              onTileClick={() => openEntryEditor('hand')}
            />
          </div>

          <div className="mj-indicator-entry-grid">
            <div className="mj-entry-block">
              <span className="mj-entry-label">宝牌指示牌</span>
              <TileStrip
                aria-label="宝牌指示牌"
                className="mj-entry-slot-strip mj-indicator-entry-strip"
                emptyLabel={null}
                emptySlotActionLabel={(index) => `录入第 ${index + 1} 张宝牌指示牌`}
                maxSlots={5}
                role="group"
                style={entrySlotStyle(5)}
                tileActionLabel={(_, tileLabel) => `编辑宝牌指示牌中的${tileLabel}`}
                tileSize="xs"
                tiles={doraIndicators}
                onEmptySlotClick={() => openEntryEditor('dora')}
                onTileClick={() => openEntryEditor('dora')}
              />
            </div>
            <div className="mj-entry-block">
              <span className="mj-entry-label">里宝牌指示牌</span>
              <TileStrip
                aria-label="里宝牌指示牌"
                className="mj-entry-slot-strip mj-indicator-entry-strip"
                emptyLabel={null}
                emptySlotActionLabel={(index) => `录入第 ${index + 1} 张里宝牌指示牌`}
                maxSlots={5}
                role="group"
                style={entrySlotStyle(5)}
                tileActionLabel={(_, tileLabel) => `编辑里宝牌指示牌中的${tileLabel}`}
                tileSize="xs"
                tiles={uraDoraIndicators}
                onEmptySlotClick={() => openEntryEditor('ura')}
                onTileClick={() => openEntryEditor('ura')}
              />
            </div>
          </div>

          <div className="mj-entry-block">
            <span className="mj-entry-label">副露</span>
            <div
              aria-label="副露"
              className="mj-tile-strip mj-entry-slot-strip mj-meld-entry-strip"
              role="group"
              style={entrySlotStyle(meldSlotCount)}
            >
              <div className="mj-tile-strip__row mj-meld-entry-strip__row">
                {melds.map((meld, meldIndex) => {
                  const kind = getMeldKind(meld);
                  return (
                    <MeldTileGroup
                      key={`${kind}-${meldIndex}`}
                      ariaLabel={`编辑第 ${meldIndex + 1} 组副露（${MELD_KIND_LABELS[kind]}）`}
                      calledTileIndex={kind === 'chi' ? null : undefined}
                      kind={kind}
                      size="xs"
                      tiles={meld.tiles.map(tileToCode)}
                      onClick={() => openEntryEditor('meld', meldIndex)}
                    />
                  );
                })}
                {Array.from({ length: meldEmptySlotCount }).map((_, index) => (
                  <button
                    key={`meld-empty-${index}`}
                    aria-label={`录入副露，第 ${meldTileCount + index + 1} 个占位`}
                    className="mj-tile mj-tile--xs mj-tile--empty"
                    disabled={melds.length >= 4}
                    type="button"
                    onClick={() => openEntryEditor('meld')}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </FieldGroup>

      <div className="mj-quick-scan-entry">
        <ActionButton
          className="mj-quick-scan-action"
          fullWidth
          icon={<Camera aria-hidden="true" />}
          variant="ghost"
          onClick={openHandRecognition}
        >
          拍照识别手牌
        </ActionButton>
      </div>

      <FieldGroup density="compact" legend="场况与规则" legendVisibility="sr-only">
        <RuleRow label="四麻 / 三麻">
          <Chip selected={mode === 'yonma'} size="sm" onClick={() => selectMode('yonma')}>四麻</Chip>
          <Chip selected={mode === 'sanma'} size="sm" onClick={() => selectMode('sanma')}>三麻</Chip>
        </RuleRow>
        <RuleRow label="场风">
          {WIND_OPTIONS.map((option) => (
            <Chip key={option.value} selected={roundWind === option.value} size="sm" onClick={() => setRoundWind(option.value)}>
              {option.label}
            </Chip>
          ))}
        </RuleRow>
        <RuleRow label="自风">
          {WIND_OPTIONS.map((option) => (
            <Chip key={option.value} selected={seatWind === option.value} size="sm" onClick={() => setSeatWind(option.value)}>
              {option.label}
            </Chip>
          ))}
        </RuleRow>
        {mode === 'sanma' ? (
          <RuleRow label="三麻拔北">
            {NORTH_DORA_OPTIONS.map((value) => (
              <Chip
                key={value}
                selected={northDoraCount === value}
                size="sm"
                onClick={() => setNorthDoraCount(value)}
              >
                {value}
              </Chip>
            ))}
          </RuleRow>
        ) : null}
        <RuleRow label="本场">
          <CounterControl
            ariaLabel="本场数"
            suffix="本场"
            value={honba}
            onChange={setHonba}
          />
        </RuleRow>
        <RuleRow label="连风雀头">
          <Chip selected={!doubleWindPairTwoFu} size="sm" onClick={() => setDoubleWindPairTwoFu(false)}>4符</Chip>
          <Chip selected={doubleWindPairTwoFu} size="sm" onClick={() => setDoubleWindPairTwoFu(true)}>2符</Chip>
        </RuleRow>
      </FieldGroup>

      <FieldGroup density="compact" legend="额外役与修正" legendVisibility="sr-only">
        <div className="mj-quick-extra-layout">
          <div className="mj-quick-chip-grid">
            {EXTRA_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                disabled={disabledConditions.has(option.key)}
                selected={conditions[option.key]}
                onClick={() => toggleCondition(option.key)}
              >
                {option.label}
              </Chip>
            ))}
            <Chip onClick={() => setCopyMessage('流局满贯需要特殊规则确认，当前不会写入结果')}>流局满贯</Chip>
            {isLegacy ? LEGACY_EVENT_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                disabled={disabledConditions.has(option.key)}
                selected={conditions[option.key]}
                title={option.note}
                onClick={() => toggleCondition(option.key)}
              >
                {option.label}
              </Chip>
            )) : null}
          </div>
          <div aria-label="常用役" className="mj-quick-common-actions">
            {COMMON_EXTRA_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                className="mj-quick-common-chip"
                disabled={disabledConditions.has(option.key)}
                selected={conditions[option.key]}
                onClick={() => toggleCondition(option.key)}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>
      </FieldGroup>

      {noYakuWarnings.length > 0 ? (
        <Alert icon={<AlertCircle aria-hidden="true" />} tone="danger" title="不能计分">
          {noYakuWarnings.join('；')}
        </Alert>
      ) : null}

      {invalidErrors.length > 0 ? (
        <Alert icon={<AlertCircle aria-hidden="true" />} tone="warning" title="输入需要调整">
          {invalidErrors.join('；')}
        </Alert>
      ) : null}

      {mode === 'sanma' ? (
        <Alert icon={<AlertCircle aria-hidden="true" />} tone="warning" title="三麻规则差异">
          拔北、北宝牌与万子缺牌按当前设置估算。
        </Alert>
      ) : null}

      <ShareBar className="mj-quick-result-actions" actions={quickActions} label={null} size="md" />

      {copyMessage ? <Alert tone="success">{copyMessage}</Alert> : null}

      <TileKeyboard
        allowRedFives
        deleteLabel={
          entryDraft?.target === 'meld' ? '删除这组' : '删除'
        }
        doneLabel="完成"
        maxTiles={
          entryDraft?.target === 'hand'
            ? draftExpectedClosedTiles
            : entryDraft?.target === 'meld'
              ? 4
              : 5
        }
        open={entryDraft !== null}
        previewHighlightIndex={draftSelectedWinTileIndex}
        previewHighlightLast={false}
        previewLabel={keyboardPreviewLabel}
        previewReadOnly={entryDraft?.target === 'meld'}
        previewMeldKind={
          entryDraft?.target === 'meld' &&
          editingMeldKind &&
          keyboardTiles.length === editingMeldExpectedTileCount
            ? editingMeldKind
            : undefined
        }
        previewMeldCalledTileIndex={editingMeldKind === 'chi' ? null : undefined}
        quickActionOnly={entryDraft?.target === 'meld'}
        replaceTilesOnInput={entryDraft?.target === 'meld'}
        getQuickActions={
          entryDraft?.target === 'hand' || entryDraft?.target === 'meld'
            ? (tile) => getQuickTileActions(tile)
            : undefined
        }
        showClearAction={entryDraft?.target !== 'meld'}
        subtitle={keyboardSubtitle}
        tiles={keyboardTiles}
        title={keyboardTitle}
        isTileDisabled={isEditorTileDisabled}
        onChange={setKeyboardTiles}
        onClose={() => setEntryDraft(null)}
        onDelete={entryDraft?.target === 'meld' ? deleteMeldEditorSelection : undefined}
        onDone={commitEntryDraft}
        onPreviewTileSelect={canSelectDraftWinTile ? selectDraftWinTileIndex : undefined}
        onQuickAction={(action, tile) => applyQuickEntryCandidate(action.id, tile)}
      />
    </div>
  );
}

function RuleRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mj-rule-row">
      <span>{label}</span>
      <div className="mj-rule-row__controls">{children}</div>
    </div>
  );
}

function QuickScorePanel({ computation, seatWind }: { computation: QuickComputation; seatWind: Wind }) {
  if (computation.kind === 'empty') {
    return (
      <SurfacePanel aria-live="polite" className="mj-score-hero mj-score-hero--quick mj-score-hero--empty" role="status">
        <span>最终点数</span>
        <strong>-</strong>
        <small>录入手牌、和牌方式和场况后显示计算结果</small>
      </SurfacePanel>
    );
  }

  if (computation.kind === 'incomplete') {
    return (
      <SurfacePanel aria-live="polite" className="mj-score-hero mj-score-hero--quick mj-score-hero--empty" role="status">
        <span>牌面未录完整</span>
        <strong className="mj-score-hero__shanten">还需录入 {computation.missing} 张</strong>
        <small>当前 {computation.current}/{computation.expected}</small>
      </SurfacePanel>
    );
  }

  if (computation.kind === 'score' && computation.result.valid) {
    const result = computation.result;
    const value = formatPoints(result.cost?.total).replace(' 点', '');
    const method = result.is_tsumo ? '自摸' : '荣和';
    const seat = WIND_LABELS[seatWind] === '东' ? '庄家' : '闲家';
    const mainPayment = result.cost ? result.cost.main + result.cost.main_bonus : undefined;
    const additionalPayment = result.cost ? result.cost.additional + result.cost.additional_bonus : undefined;

    return (
      <SurfacePanel aria-live="polite" className="mj-score-hero mj-score-hero--quick" role="status" tone="success">
        <span>最终点数</span>
        <strong>{value}</strong>
        <small>{seat}{method} · {formatHan(result.han)}{formatFu(result.fu)} · {formatLimit(result)}</small>
        <div className="mj-score-badges">
          {!result.is_tsumo ? <b>放铳 {formatPoints(mainPayment).replace(' 点', '')}</b> : null}
          {result.is_tsumo && result.is_dealer ? <b>每家 {formatPoints(mainPayment).replace(' 点', '')}</b> : null}
          {result.is_tsumo && !result.is_dealer ? <b>庄家 {formatPoints(mainPayment).replace(' 点', '')}</b> : null}
          {result.is_tsumo && !result.is_dealer ? <b>子家 {formatPoints(additionalPayment).replace(' 点', '')}</b> : null}
        </div>
      </SurfacePanel>
    );
  }

  if (computation.kind === 'efficiency') {
    const result = computation.result;
    const effectiveTiles = result.effective_tiles.slice(0, 7).map((entry) => tileToCode(entry.tile));
    const shantenText = formatShanten(result.shanten);
    return (
      <SurfacePanel aria-live="polite" className="mj-score-hero mj-score-hero--quick mj-score-hero--empty" role="status">
        <span>未和牌</span>
        <strong className="mj-score-hero__shanten">{shantenText}</strong>
        <small>有效牌 {result.total_effective_tiles} 枚</small>
        <div className="mj-quick-tile-row mj-score-hero__effective-tiles">
          {effectiveTiles.length > 0 ? (
            effectiveTiles.map((tile, index) => (
              <MahjongTile key={`${tile}-${index}`} code={tile} size="sm" />
            ))
          ) : (
            <span className="mj-muted-line">没有可列出的有效牌</span>
          )}
        </div>
      </SurfacePanel>
    );
  }

  return null;
}
