import { baseTileCode, countPhysicalTiles, type BaseTileCode, type Tile, type Wind } from './tiles';

export type ScoreMode = 'yonma' | 'sanma';
export type MeldKind = 'chi' | 'pon' | 'openKan' | 'closedKan' | 'addedKan';

export interface MeldInput {
  kind: MeldKind;
  tiles: Tile[];
}

export interface ScoreConditions {
  doubleRiichi: boolean;
  riichi: boolean;
  ippatsu: boolean;
  rinshan: boolean;
  tsumo: boolean;
  haiteiOrHoutei: boolean;
  chankan: boolean;
  tenhou: boolean;
  chiihou: boolean;
}

export interface ScoreInput {
  mode: ScoreMode;
  handTiles: Tile[];
  melds: MeldInput[];
  doraIndicators: Tile[];
  uraDoraIndicators: Tile[];
  northDoraCount: 0 | 1 | 2 | 3 | 4;
  roundWind: Wind;
  seatWind: Wind;
  honba: number;
  doubleWindPairTwoFu: boolean;
  conditions: ScoreConditions;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export const DEFAULT_SCORE_CONDITIONS: ScoreConditions = {
  doubleRiichi: false,
  riichi: false,
  ippatsu: false,
  rinshan: false,
  tsumo: false,
  haiteiOrHoutei: false,
  chankan: false,
  tenhou: false,
  chiihou: false,
};

function allPhysicalTiles(input: ScoreInput): Tile[] {
  return [
    ...input.handTiles,
    ...input.melds.flatMap((meld) => meld.tiles),
    ...input.doraIndicators,
    ...input.uraDoraIndicators,
    ...Array.from({ length: input.mode === 'sanma' ? input.northDoraCount : 0 }, () => ({
      code: 'z4' as const,
      suit: 'z' as const,
      rank: 4 as const,
      red: false,
    })),
  ];
}

function validatePhysicalCounts(tiles: readonly Tile[], errors: string[]): void {
  const counts = countPhysicalTiles(tiles);
  for (const [code, count] of counts.entries()) {
    if (count > 4) errors.push(`${code} 超过 4 枚，赤五与普通五按同一张物理牌计数`);
  }
}

function validateMeldShape(meld: MeldInput, errors: string[]): void {
  const baseCodes = meld.tiles.map((tile) => baseTileCode(tile.code));
  const unique = new Set(baseCodes);
  if (meld.kind === 'chi') {
    if (meld.tiles.length !== 3) {
      errors.push('吃牌必须正好 3 枚');
      return;
    }
    const [firstSuit] = meld.tiles;
    const ranks = meld.tiles.map((tile) => tile.rank).sort((a, b) => a - b);
    if (
      firstSuit.suit === 'z' ||
      !meld.tiles.every((tile) => tile.suit === firstSuit.suit) ||
      ranks[0] + 1 !== ranks[1] ||
      ranks[1] + 1 !== ranks[2]
    ) {
      errors.push('吃牌必须是同一数牌花色的连续 3 枚');
    }
    return;
  }

  const expectedLength = meld.kind === 'pon' ? 3 : 4;
  if (meld.tiles.length !== expectedLength) {
    errors.push(`${meld.kind} 必须正好 ${expectedLength} 枚`);
    return;
  }
  if (unique.size !== 1) errors.push(`${meld.kind} 必须由相同牌组成`);
}

export function expectedClosedTileCount(meldCount: number): number {
  return 14 - meldCount * 3;
}

export function isCompleteHandTileCount(input: ScoreInput): boolean {
  return input.handTiles.length + input.melds.length * 3 === 14;
}

export function getClosedBaseTileCounts(tiles: readonly Tile[]): Map<BaseTileCode, number> {
  const counts = new Map<BaseTileCode, number>();
  for (const tile of tiles) {
    const base = baseTileCode(tile.code);
    counts.set(base, (counts.get(base) ?? 0) + 1);
  }
  return counts;
}

export function validateScoreInput(input: ScoreInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (input.handTiles.length === 0) errors.push('请先选择手牌');
  if (input.melds.length > 4) errors.push('副露数量不能超过 4 组');
  if (!Number.isInteger(input.honba) || input.honba < 0) errors.push('本场数必须是非负整数');
  if (input.northDoraCount < 0 || input.northDoraCount > 4) errors.push('拔北宝牌数必须在 0 到 4 之间');
  if (input.mode === 'yonma' && input.northDoraCount > 0) warnings.push('四麻通常不使用拔北宝牌，本次会忽略拔北数');

  for (const meld of input.melds) validateMeldShape(meld, errors);
  validatePhysicalCounts(allPhysicalTiles(input), errors);

  const expectedClosed = expectedClosedTileCount(input.melds.length);
  if (input.handTiles.length !== expectedClosed) {
    warnings.push(`当前手牌 ${input.handTiles.length} 枚；完整和牌计算通常需要 ${expectedClosed} 枚（副露按 3 枚折算）`);
  }

  if (input.mode === 'sanma') {
    if (input.melds.some((meld) => meld.kind === 'chi')) errors.push('三麻快速算分不支持吃牌');
    warnings.push('三麻按常见日式三麻自摸损结算；不同店规可能不同');
  }

  if (input.conditions.doubleRiichi && input.conditions.riichi) warnings.push('已选择两立直时无需再选择立直');
  if (input.conditions.ippatsu && !input.conditions.riichi && !input.conditions.doubleRiichi) {
    errors.push('一发必须与立直或两立直同时成立');
  }
  if (input.conditions.tenhou && input.conditions.chiihou) errors.push('天和与地和不能同时成立');
  if (input.conditions.tenhou && input.seatWind !== 'east') warnings.push('天和通常只适用于庄家');
  if (input.conditions.chiihou && input.seatWind === 'east') warnings.push('地和通常只适用于子家');
  if (input.conditions.chankan && input.conditions.tsumo) errors.push('抢杠属于荣和条件，不能与自摸同时选择');

  return { ok: errors.length === 0, errors, warnings };
}
