import { calculateHandEfficiency } from './efficiency';
import type { WinMethod } from './points';
import { calculateScoreOrEfficiency, type ScoreResult } from './scoring';
import {
  ALL_BASE_TILE_CODES,
  countPhysicalTiles,
  parseTileCodes,
  tileRank,
  tileSuit,
  type BaseTileCode,
  type NumberSuit,
  type Tile,
  type TileCode,
  type Wind,
} from './tiles';
import {
  createMeldInput,
  DEFAULT_SCORE_CONDITIONS,
  type MeldInput,
  type MeldKind,
  type ScoreConditions,
  type ScoreInput,
} from './validation';

const NUMBER_SUITS: readonly NumberSuit[] = ['m', 'p', 's'];
const ROUND_WINDS: readonly Wind[] = ['east', 'south'];
const SEAT_WINDS: readonly Wind[] = ['east', 'south', 'west', 'north'];
const MAX_GENERATION_ATTEMPTS = 256;

export type PracticeHandGroupKind =
  | 'sequence'
  | 'triplet'
  | 'pair'
  | 'chi'
  | 'pon'
  | 'openKan'
  | 'closedKan';

export interface PracticeHandGroup {
  kind: PracticeHandGroupKind;
  tiles: readonly TileCode[];
  calledIndex?: number;
  backIndexes?: readonly number[];
  winningIndex?: number;
}

export interface GeneratedPracticeHand {
  handTiles: Tile[];
  handGroups: readonly PracticeHandGroup[];
  melds: MeldInput[];
  winTile: Tile;
  roundWind: Wind;
  seatWind: Wind;
  winMethod: WinMethod;
  conditions: ScoreConditions;
  visibleConditions: readonly string[];
  isSevenPairs: boolean;
  scoreInput: ScoreInput;
  score: ScoreResult;
}

export interface GeneratedChinitsuHand {
  id: string;
  suit: NumberSuit;
  handTiles: Tile[];
  candidateRanks: number[];
  correctWaits: number[];
}

export type PracticeScoreTarget = 'fu' | 'point-valid' | 'point-no-yaku';

interface GroupDraft {
  kind: PracticeHandGroupKind;
  codes: BaseTileCode[];
  calledIndex?: number;
  backIndexes?: readonly number[];
}

interface CandidateContext {
  roundWind: Wind;
  seatWind: Wind;
  winMethod: WinMethod;
  conditions: ScoreConditions;
  visibleConditions: readonly string[];
}

export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = normalizeSeed(seed);
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  }

  int(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error(`maxExclusive must be a positive integer, received ${maxExclusive}`);
    }
    return Math.floor(this.next() * maxExclusive);
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) throw new Error('Cannot pick from an empty collection');
    return values[this.int(values.length)];
  }

  shuffle<T>(values: readonly T[]): T[] {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = this.int(index + 1);
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }
}

export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) return 0;
  return Math.trunc(seed) >>> 0;
}

export function derivePracticeSeed(seed: number, namespace: string): number {
  return hashString(`${normalizeSeed(seed)}:${namespace}`);
}

export function makePracticeQuestionId(prefix: string, payload: unknown): string {
  return `${prefix}-${hashString(JSON.stringify(payload)).toString(36)}`;
}

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function baseCode(suit: NumberSuit, rank: number): BaseTileCode {
  return `${suit}${rank}` as BaseTileCode;
}

function randomSequence(rng: SeededRandom, suit?: NumberSuit): BaseTileCode[] {
  const selectedSuit = suit ?? rng.pick(NUMBER_SUITS);
  const start = rng.int(7) + 1;
  return [baseCode(selectedSuit, start), baseCode(selectedSuit, start + 1), baseCode(selectedSuit, start + 2)];
}

function randomTriplet(rng: SeededRandom): BaseTileCode[] {
  const code = rng.pick(ALL_BASE_TILE_CODES);
  return [code, code, code];
}

function randomPair(rng: SeededRandom): BaseTileCode[] {
  const code = rng.pick(ALL_BASE_TILE_CODES);
  return [code, code];
}

function hasLegalPhysicalCounts(codes: readonly TileCode[]): boolean {
  const counts = new Map<BaseTileCode, number>();
  for (const code of codes) {
    const base = code as BaseTileCode;
    const count = (counts.get(base) ?? 0) + 1;
    if (count > 4) return false;
    counts.set(base, count);
  }
  return true;
}

function isMeldGroup(kind: PracticeHandGroupKind): boolean {
  return kind === 'chi' || kind === 'pon' || kind === 'openKan' || kind === 'closedKan';
}

function meldKind(kind: PracticeHandGroupKind): MeldKind | null {
  if (kind === 'chi' || kind === 'pon' || kind === 'openKan' || kind === 'closedKan') return kind;
  return null;
}

function randomStandardDrafts(rng: SeededRandom): GroupDraft[] | null {
  const groups: GroupDraft[] = [];

  for (let index = 0; index < 4; index += 1) {
    const sequence = rng.chance(0.62);
    const codes = sequence ? randomSequence(rng) : randomTriplet(rng);
    let kind: PracticeHandGroupKind = sequence ? 'sequence' : 'triplet';

    if (!sequence && rng.chance(0.06)) {
      kind = 'closedKan';
      codes.push(codes[0]);
    } else if (rng.chance(0.2)) {
      if (sequence) {
        kind = 'chi';
      } else if (rng.chance(0.14)) {
        kind = 'openKan';
        codes.push(codes[0]);
      } else {
        kind = 'pon';
      }
    }

    groups.push({
      kind,
      codes,
      calledIndex: kind === 'chi' || kind === 'pon' || kind === 'openKan' ? rng.int(codes.length) : undefined,
      backIndexes: kind === 'closedKan' ? [0, 3] : undefined,
    });
  }

  groups.push({ kind: 'pair', codes: randomPair(rng) });
  return hasLegalPhysicalCounts(groups.flatMap((group) => group.codes)) ? groups : null;
}

function randomSevenPairsDrafts(rng: SeededRandom): GroupDraft[] {
  return rng
    .shuffle(ALL_BASE_TILE_CODES)
    .slice(0, 7)
    .map((code) => ({ kind: 'pair', codes: [code, code] }));
}

function makeContext(rng: SeededRandom, target: PracticeScoreTarget): CandidateContext {
  const winMethod: WinMethod = target === 'point-no-yaku' ? 'ron' : rng.chance(0.5) ? 'ron' : 'tsumo';
  const isFuPractice = target === 'fu';
  return {
    roundWind: rng.pick(ROUND_WINDS),
    seatWind: rng.pick(SEAT_WINDS),
    winMethod,
    conditions: {
      ...DEFAULT_SCORE_CONDITIONS,
      tsumo: winMethod === 'tsumo',
      haiteiOrHoutei: isFuPractice,
    },
    visibleConditions: isFuPractice ? [winMethod === 'tsumo' ? '海底摸月' : '河底捞鱼'] : [],
  };
}

function materializeCandidate(
  drafts: readonly GroupDraft[],
  context: CandidateContext,
  rng: SeededRandom,
  isSevenPairs: boolean,
  fixedWinningGroupIndex?: number,
): Omit<GeneratedPracticeHand, 'score'> | null {
  if (!hasLegalPhysicalCounts(drafts.flatMap((group) => group.codes))) return null;

  const concealedIndexes = drafts
    .map((group, index) => (!isMeldGroup(group.kind) ? index : -1))
    .filter((index) => index >= 0);
  if (concealedIndexes.length === 0) return null;

  const winningGroupIndex = fixedWinningGroupIndex ?? rng.pick(concealedIndexes);
  const winningDraft = drafts[winningGroupIndex];
  const winningIndex = fixedWinningGroupIndex === undefined ? rng.int(winningDraft.codes.length) : winningDraft.codes.length - 1;

  const allTiles = parseTileCodes(drafts.flatMap((group) => group.codes));
  const tileSlices: Tile[][] = [];
  let cursor = 0;
  for (const group of drafts) {
    tileSlices.push(allTiles.slice(cursor, cursor + group.codes.length));
    cursor += group.codes.length;
  }

  const handTiles = tileSlices.flatMap((tiles, index) => (isMeldGroup(drafts[index].kind) ? [] : tiles));
  const melds = drafts.flatMap((group, index) => {
    const kind = meldKind(group.kind);
    return kind ? [createMeldInput(kind, tileSlices[index])] : [];
  });
  const winTile = tileSlices[winningGroupIndex][winningIndex];
  if (!handTiles.includes(winTile)) return null;

  const handGroups: PracticeHandGroup[] = drafts.map((group, index) => ({
    kind: group.kind,
    tiles: group.codes,
    calledIndex: group.calledIndex,
    backIndexes: group.backIndexes,
    winningIndex: index === winningGroupIndex ? winningIndex : undefined,
  }));
  const scoreInput: ScoreInput = {
    mode: 'yonma',
    handTiles,
    winTile,
    melds,
    doraIndicators: [],
    uraDoraIndicators: [],
    northDoraCount: 0,
    roundWind: context.roundWind,
    seatWind: context.seatWind,
    honba: 0,
    doubleWindPairTwoFu: false,
    conditions: context.conditions,
  };

  return {
    handTiles,
    handGroups,
    melds,
    winTile,
    roundWind: context.roundWind,
    seatWind: context.seatWind,
    winMethod: context.winMethod,
    conditions: context.conditions,
    visibleConditions: context.visibleConditions,
    isSevenPairs,
    scoreInput,
  };
}

function isYakuman(score: ScoreResult): boolean {
  return score.yaku.some((item) => typeof item.han !== 'number');
}

function acceptScore(score: ScoreResult, target: PracticeScoreTarget): boolean {
  if (target === 'point-no-yaku') {
    return !score.valid && score.han === 0 && score.yaku.length === 0;
  }
  return score.valid && score.fu !== undefined && score.cost !== undefined && !isYakuman(score);
}

function scoreCandidate(candidate: Omit<GeneratedPracticeHand, 'score'>, target: PracticeScoreTarget): GeneratedPracticeHand | null {
  const computation = calculateScoreOrEfficiency(candidate.scoreInput);
  if (computation.kind !== 'score' || !acceptScore(computation.result, target)) return null;
  return { ...candidate, score: computation.result };
}

function safeDrafts(target: PracticeScoreTarget, sevenPairs: boolean): GroupDraft[] {
  if (sevenPairs) {
    return ['m1', 'm3', 'm5', 'p2', 'p4', 's6', 'z7'].map((code) => ({
      kind: 'pair' as const,
      codes: [code as BaseTileCode, code as BaseTileCode],
    }));
  }
  if (target === 'point-no-yaku') {
    return [
      { kind: 'sequence', codes: ['m1', 'm2', 'm3'] },
      { kind: 'sequence', codes: ['m4', 'm5', 'm6'] },
      { kind: 'sequence', codes: ['p7', 'p8', 'p9'] },
      { kind: 'sequence', codes: ['s2', 's3', 's4'] },
      { kind: 'pair', codes: ['z4', 'z4'] },
    ];
  }
  if (target === 'point-valid') {
    return [
      { kind: 'sequence', codes: ['m2', 'm3', 'm4'] },
      { kind: 'sequence', codes: ['m4', 'm5', 'm6'] },
      { kind: 'sequence', codes: ['p2', 'p3', 'p4'] },
      { kind: 'sequence', codes: ['s6', 's7', 's8'] },
      { kind: 'pair', codes: ['p5', 'p5'] },
    ];
  }
  return [
    { kind: 'sequence', codes: ['m1', 'm2', 'm3'] },
    { kind: 'sequence', codes: ['m4', 'm5', 'm6'] },
    { kind: 'sequence', codes: ['p2', 'p3', 'p4'] },
    { kind: 'triplet', codes: ['s1', 's1', 's1'] },
    { kind: 'pair', codes: ['z5', 'z5'] },
  ];
}

function safeContext(target: PracticeScoreTarget, seed: number): CandidateContext {
  if (target === 'point-no-yaku') {
    return {
      roundWind: 'east',
      seatWind: 'south',
      winMethod: 'ron',
      conditions: { ...DEFAULT_SCORE_CONDITIONS },
      visibleConditions: [],
    };
  }
  const winMethod: WinMethod = normalizeSeed(seed) % 2 === 0 ? 'ron' : 'tsumo';
  const isFuPractice = target === 'fu';
  return {
    roundWind: 'east',
    seatWind: 'south',
    winMethod,
    conditions: {
      ...DEFAULT_SCORE_CONDITIONS,
      tsumo: winMethod === 'tsumo',
      haiteiOrHoutei: isFuPractice,
    },
    visibleConditions: isFuPractice ? [winMethod === 'tsumo' ? '海底摸月' : '河底捞鱼'] : [],
  };
}

export function generateScoredPracticeHand(
  seed: number,
  target: PracticeScoreTarget,
  options: { sevenPairs?: boolean } = {},
): GeneratedPracticeHand {
  const sevenPairs = options.sevenPairs ?? false;
  const rng = new SeededRandom(derivePracticeSeed(seed, `${target}:${sevenPairs ? 'seven-pairs' : 'standard'}`));

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const drafts = sevenPairs ? randomSevenPairsDrafts(rng) : randomStandardDrafts(rng);
    if (!drafts) continue;
    const candidate = materializeCandidate(drafts, makeContext(rng, target), rng, sevenPairs);
    if (!candidate) continue;
    const scored = scoreCandidate(candidate, target);
    if (scored) return scored;
  }

  const fallbackRng = new SeededRandom(derivePracticeSeed(seed, `fallback:${target}:${sevenPairs}`));
  const fallbackDrafts = safeDrafts(target, sevenPairs);
  const fallback = materializeCandidate(
    fallbackDrafts,
    safeContext(target, seed),
    fallbackRng,
    sevenPairs,
    fallbackDrafts.length - 1,
  );
  const scoredFallback = fallback ? scoreCandidate(fallback, target) : null;
  if (!scoredFallback) throw new Error(`Unable to generate a safe ${target} practice hand`);
  return scoredFallback;
}

function chinitsuDraftCodes(rng: SeededRandom, suit: NumberSuit): BaseTileCode[] | null {
  const groups = Array.from({ length: 4 }, () =>
    rng.chance(0.7)
      ? randomSequence(rng, suit)
      : (() => {
          const code = baseCode(suit, rng.int(9) + 1);
          return [code, code, code];
        })(),
  );
  const pairCode = baseCode(suit, rng.int(9) + 1);
  const codes = [...groups.flat(), pairCode, pairCode];
  return hasLegalPhysicalCounts(codes) ? codes : null;
}

function chinitsuWaits(handTiles: readonly Tile[], suit: NumberSuit): number[] {
  const result = calculateHandEfficiency({ mode: 'yonma', handTiles });
  if (result.shanten !== 0) return [];
  return [...new Set(
    result.effective_tiles
      .filter((entry) => entry.remaining_count > 0 && tileSuit(entry.tile) === suit)
      .map((entry) => Number(tileRank(entry.tile))),
  )].sort((left, right) => left - right);
}

export function generateChinitsuHand(seed: number): GeneratedChinitsuHand {
  const rng = new SeededRandom(derivePracticeSeed(seed, 'chinitsu'));

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const suit = rng.pick(NUMBER_SUITS);
    const completeCodes = chinitsuDraftCodes(rng, suit);
    if (!completeCodes) continue;
    const removedIndex = rng.int(completeCodes.length);
    const handCodes = completeCodes.filter((_, index) => index !== removedIndex).sort((left, right) => Number(left[1]) - Number(right[1]));
    const handTiles = parseTileCodes(handCodes);
    const correctWaits = chinitsuWaits(handTiles, suit);
    if (correctWaits.length < 2) continue;

    const id = makePracticeQuestionId('chinitsu', { suit, handCodes, correctWaits });
    return { id, suit, handTiles, candidateRanks: [1, 2, 3, 4, 5, 6, 7, 8, 9], correctWaits };
  }

  const suit = NUMBER_SUITS[normalizeSeed(seed) % NUMBER_SUITS.length];
  const handCodes = [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9].map((rank) => baseCode(suit, rank));
  const handTiles = parseTileCodes(handCodes);
  const correctWaits = chinitsuWaits(handTiles, suit);
  return {
    id: makePracticeQuestionId('chinitsu', { suit, handCodes, correctWaits }),
    suit,
    handTiles,
    candidateRanks: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    correctWaits,
  };
}

export function countGeneratedPhysicalTiles(hand: GeneratedPracticeHand): Map<BaseTileCode, number> {
  return countPhysicalTiles([...hand.handTiles, ...hand.melds.flatMap((meld) => meld.tiles)]);
}
