import {
  DEFAULT_SCORE_CONDITIONS,
  isTileCode,
  type MeldKind,
  type ScoreConditions,
  type ScoreMode,
  type TileCode,
  type Wind,
} from '../domain';

export type ScoreDraftVariant = 'quick' | 'legacy';

export interface ScoreDraftMeld {
  kind: MeldKind;
  tiles: TileCode[];
}

export interface ScoreDraftV1 {
  version: 1;
  mode: ScoreMode;
  handTiles: TileCode[];
  winTileIndex: number | null;
  melds: ScoreDraftMeld[];
  doraIndicators: TileCode[];
  uraDoraIndicators: TileCode[];
  roundWind: Wind;
  seatWind: Wind;
  honba: number;
  northDoraCount: 0 | 1 | 2 | 3 | 4;
  doubleWindPairTwoFu: boolean;
  conditions: ScoreConditions;
}

export interface ScoreDraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const CONDITION_KEYS = Object.keys(DEFAULT_SCORE_CONDITIONS) as Array<keyof ScoreConditions>;
const MELD_KINDS: readonly MeldKind[] = ['chi', 'pon', 'openKan', 'closedKan', 'addedKan'];
const WINDS: readonly Wind[] = ['east', 'south', 'west', 'north'];

export function scoreDraftStorageKey(variant: ScoreDraftVariant) {
  return `mahjong.scoreDraft.${variant}.v1`;
}

export function createDefaultScoreDraft(): ScoreDraftV1 {
  return {
    version: 1,
    mode: 'yonma',
    handTiles: [],
    winTileIndex: null,
    melds: [],
    doraIndicators: [],
    uraDoraIndicators: [],
    roundWind: 'east',
    seatWind: 'south',
    honba: 0,
    northDoraCount: 0,
    doubleWindPairTwoFu: false,
    conditions: { ...DEFAULT_SCORE_CONDITIONS },
  };
}

export function applyScoreDraftTileImport(
  draft: ScoreDraftV1,
  importedTiles: TileCode[],
): ScoreDraftV1 {
  if (importedTiles.length === 0) return draft;
  const handTiles = importedTiles.slice(0, 14);
  return {
    ...draft,
    handTiles,
    winTileIndex: handTiles.length - 1,
  };
}

function browserSessionStorage(): ScoreDraftStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

function isTileCodeArray(value: unknown, maxLength: number): value is TileCode[] {
  return Array.isArray(value) && value.length <= maxLength && value.every(isTileCode);
}

function isScoreConditions(value: unknown): value is ScoreConditions {
  if (!value || typeof value !== 'object') return false;
  const conditions = value as Record<string, unknown>;
  return CONDITION_KEYS.every((key) => typeof conditions[key] === 'boolean');
}

function isDraftMeld(value: unknown): value is ScoreDraftMeld {
  if (!value || typeof value !== 'object') return false;
  const meld = value as Record<string, unknown>;
  if (!MELD_KINDS.includes(meld.kind as MeldKind) || !isTileCodeArray(meld.tiles, 4)) return false;
  const expectedLength = meld.kind === 'openKan' || meld.kind === 'closedKan' || meld.kind === 'addedKan' ? 4 : 3;
  return meld.tiles.length === expectedLength;
}

export function isScoreDraftV1(value: unknown): value is ScoreDraftV1 {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Record<string, unknown>;
  if (draft.version !== 1 || (draft.mode !== 'yonma' && draft.mode !== 'sanma')) return false;
  if (!isTileCodeArray(draft.handTiles, 14)) return false;
  if (!isTileCodeArray(draft.doraIndicators, 5) || !isTileCodeArray(draft.uraDoraIndicators, 5)) return false;
  if (!Array.isArray(draft.melds) || draft.melds.length > 4 || !draft.melds.every(isDraftMeld)) return false;
  if (!WINDS.includes(draft.roundWind as Wind) || !WINDS.includes(draft.seatWind as Wind)) return false;
  if (!Number.isInteger(draft.honba) || (draft.honba as number) < 0) return false;
  if (![0, 1, 2, 3, 4].includes(draft.northDoraCount as number)) return false;
  if (typeof draft.doubleWindPairTwoFu !== 'boolean' || !isScoreConditions(draft.conditions)) return false;

  const winTileIndex = draft.winTileIndex;
  if (
    winTileIndex !== null &&
    (!Number.isInteger(winTileIndex) || (winTileIndex as number) < 0 || (winTileIndex as number) >= draft.handTiles.length)
  ) {
    return false;
  }

  return true;
}

export function loadScoreDraft(
  variant: ScoreDraftVariant,
  storage: ScoreDraftStorage | undefined = browserSessionStorage(),
): ScoreDraftV1 {
  if (!storage) return createDefaultScoreDraft();
  try {
    const raw = storage.getItem(scoreDraftStorageKey(variant));
    if (!raw) return createDefaultScoreDraft();
    const parsed: unknown = JSON.parse(raw);
    return isScoreDraftV1(parsed) ? parsed : createDefaultScoreDraft();
  } catch {
    return createDefaultScoreDraft();
  }
}

export function saveScoreDraft(
  variant: ScoreDraftVariant,
  draft: ScoreDraftV1,
  storage: ScoreDraftStorage | undefined = browserSessionStorage(),
) {
  if (!storage) return;
  try {
    storage.setItem(scoreDraftStorageKey(variant), JSON.stringify(draft));
  } catch {
    // Storage may be blocked or full. Page-local state remains usable.
  }
}

export function clearScoreDraft(
  variant: ScoreDraftVariant,
  storage: ScoreDraftStorage | undefined = browserSessionStorage(),
) {
  if (!storage) return;
  try {
    storage.removeItem(scoreDraftStorageKey(variant));
  } catch {
    // Ignore blocked storage; the visible form is still reset by the caller.
  }
}
