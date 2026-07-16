import {
  baseTileCode,
  getTileMeta,
  isRedFive,
  type NumberSuit,
  type TileCode,
} from './tiles';
import { expectedClosedTileCount, type MeldKind, type ScoreMode } from './validation';

export type QuickEntryTarget = 'hand' | 'meld';
export type QuickEntryCandidateKind = 'sequence' | 'pair' | 'triplet' | 'closedKan' | 'openKan';

export interface QuickEntryCandidate {
  id: string;
  kind: QuickEntryCandidateKind;
  label: string;
  tiles: TileCode[];
  destination: QuickEntryTarget;
  meldKind?: MeldKind;
}

export interface BuildQuickEntryCandidatesOptions {
  target: QuickEntryTarget;
  anchor: TileCode;
  mode: ScoreMode;
  /** Every already-used physical tile except the active anchor or meld being replaced. */
  inventory: readonly TileCode[];
  /** Closed-hand tile count after removing the active hand anchor, when there is one. */
  handTileCount: number;
  meldCount: number;
  replacingMeld?: boolean;
}

function isAllowedInMode(code: TileCode, mode: ScoreMode): boolean {
  if (mode !== 'sanma') return true;
  const meta = getTileMeta(code);
  return !(meta.suit === 'm' && meta.rank >= 2 && meta.rank <= 8);
}

export function canUseTileCodes(
  inventory: readonly TileCode[],
  additions: readonly TileCode[],
  mode: ScoreMode,
): boolean {
  const baseCounts = new Map<string, number>();
  const redCounts = new Map<string, number>();

  for (const code of [...inventory, ...additions]) {
    if (!isAllowedInMode(code, mode)) return false;
    const base = baseTileCode(code);
    const baseCount = (baseCounts.get(base) ?? 0) + 1;
    if (baseCount > 4) return false;
    baseCounts.set(base, baseCount);

    if (isRedFive(code)) {
      const redCount = (redCounts.get(base) ?? 0) + 1;
      if (redCount > 1) return false;
      redCounts.set(base, redCount);
    }
  }

  return true;
}

function numberTileCode(suit: NumberSuit, rank: number, red = false): TileCode {
  return `${suit}${rank}${red ? 'r' : ''}` as TileCode;
}

function sequenceCandidates(anchor: TileCode): QuickEntryCandidate[] {
  const meta = getTileMeta(anchor);
  if (meta.suit === 'z' || meta.rank > 7) return [];

  const suit = meta.suit;
  const normalTiles = [meta.rank, meta.rank + 1, meta.rank + 2].map((rank) => numberTileCode(suit, rank));
  const candidates: QuickEntryCandidate[] = [
    {
      id: 'sequence-normal',
      kind: 'sequence',
      label: '顺子',
      tiles: normalTiles,
      destination: 'hand',
    },
  ];

  const fiveIndex = normalTiles.findIndex((tile) => baseTileCode(tile) === `${suit}5`);
  if (fiveIndex >= 0) {
    const redTiles = [...normalTiles];
    redTiles[fiveIndex] = numberTileCode(suit, 5, true);
    candidates.push({
      id: 'sequence-red-five',
      kind: 'sequence',
      label: '顺子·赤五',
      tiles: redTiles,
      destination: 'hand',
    });
  }

  return candidates;
}

function repeatedTiles(anchor: TileCode, count: number): TileCode[] {
  const base = baseTileCode(anchor);
  if (!isRedFive(anchor)) return Array.from({ length: count }, () => anchor);
  return [anchor, ...Array.from({ length: count - 1 }, () => base)];
}

function fitsDestination(
  candidate: QuickEntryCandidate,
  options: BuildQuickEntryCandidatesOptions,
): boolean {
  if (candidate.destination === 'hand') {
    return options.handTileCount + candidate.tiles.length <= expectedClosedTileCount(options.meldCount);
  }

  const nextMeldCount = options.replacingMeld ? options.meldCount : options.meldCount + 1;
  return nextMeldCount <= 4 && options.handTileCount <= expectedClosedTileCount(nextMeldCount);
}

export function buildQuickEntryCandidates(options: BuildQuickEntryCandidatesOptions): QuickEntryCandidate[] {
  const { anchor, inventory, mode, target } = options;
  const candidates: QuickEntryCandidate[] = sequenceCandidates(anchor).map((candidate) => ({
    ...candidate,
    destination: target,
    meldKind: target === 'meld' ? ('chi' as const) : undefined,
  }));

  if (target === 'hand') {
    candidates.push({
      id: 'pair',
      kind: 'pair',
      label: '对子',
      tiles: repeatedTiles(anchor, 2),
      destination: 'hand',
    });
  }

  candidates.push({
    id: 'triplet',
    kind: 'triplet',
    label: '刻子',
    tiles: repeatedTiles(anchor, 3),
    destination: target,
    meldKind: target === 'meld' ? 'pon' : undefined,
  });

  if (target === 'meld') {
    candidates.push({
      id: 'closed-kan',
      kind: 'closedKan',
      label: '暗杠',
      tiles: repeatedTiles(anchor, 4),
      destination: 'meld',
      meldKind: 'closedKan',
    },
    {
      id: 'open-kan',
      kind: 'openKan',
      label: '明杠',
      tiles: repeatedTiles(anchor, 4),
      destination: 'meld',
      meldKind: 'openKan',
    });
  }

  return candidates.filter(
    (candidate) =>
      canUseTileCodes(inventory, candidate.tiles, mode) && fitsDestination(candidate, options),
  );
}
