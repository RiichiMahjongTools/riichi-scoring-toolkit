import { Meld } from 'mahjong-ts';
import {
  baseTileCode,
  countPhysicalTiles,
  createTile,
  getTileMeta,
  isRedFive,
  tileTo34,
  type BaseTileCode,
  type Tile,
  type Wind,
} from './tiles';

export type ScoreMode = 'yonma' | 'sanma';
export type MeldKind = 'chi' | 'pon' | 'openKan' | 'closedKan' | 'addedKan';
export type MeldInput = Meld;

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
  renhou: boolean;
  tsubameGaeshi: boolean;
  kanfuri: boolean;
}

export interface ScoreInput {
  mode: ScoreMode;
  handTiles: Tile[];
  winTile: Tile | null;
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
  renhou: false,
  tsubameGaeshi: false,
  kanfuri: false,
};

const MELD_KIND_TO_MAHJONG_TYPE: Record<MeldKind, string> = {
  chi: Meld.CHI,
  pon: Meld.PON,
  openKan: Meld.KAN,
  closedKan: Meld.KAN,
  addedKan: Meld.SHOUMINKAN,
};

export function createMeldInput(kind: MeldKind, tiles: readonly Tile[]): MeldInput {
  return new Meld({
    meld_type: MELD_KIND_TO_MAHJONG_TYPE[kind],
    tiles,
    opened: kind !== 'closedKan',
    called_tile: tiles[0] ?? null,
    who: 0,
  });
}

export function getMeldKind(meld: MeldInput): MeldKind {
  if (meld.type === Meld.CHI) return 'chi';
  if (meld.type === Meld.PON) return 'pon';
  if (meld.type === Meld.SHOUMINKAN) return 'addedKan';
  if (meld.type === Meld.KAN && !meld.opened) return 'closedKan';
  return 'openKan';
}

function allPhysicalTiles(input: ScoreInput): Tile[] {
  return [
    ...input.handTiles,
    ...input.melds.flatMap((meld) => meld.tiles),
    ...input.doraIndicators,
    ...input.uraDoraIndicators,
    ...Array.from({ length: input.mode === 'sanma' ? input.northDoraCount : 0 }, () => createTile('z4')),
  ];
}

function validatePhysicalCounts(tiles: readonly Tile[], errors: string[]): void {
  const counts = countPhysicalTiles(tiles);
  for (const [code, count] of counts.entries()) {
    if (count > 4) errors.push(`${code} 超过 4 枚，赤五与普通五按同一张物理牌计数`);
  }

  const redCounts = new Map<BaseTileCode, number>();
  for (const tile of tiles) {
    if (!isRedFive(tile)) continue;
    const base = baseTileCode(tile);
    redCounts.set(base, (redCounts.get(base) ?? 0) + 1);
  }
  for (const [code, count] of redCounts.entries()) {
    if (count > 1) errors.push(`${code} 赤五最多只能有 1 枚`);
  }
}

function validateMeldShape(meld: MeldInput, errors: string[]): void {
  const kind = getMeldKind(meld);
  const tiles = meld.tiles;
  const baseCodes = tiles.map(baseTileCode);
  const unique = new Set(baseCodes);

  if (kind === 'chi') {
    if (tiles.length !== 3) {
      errors.push('吃牌必须正好 3 枚');
      return;
    }
    const [first] = tiles.map(getTileMeta);
    const metas = tiles.map(getTileMeta);
    const ranks = metas.map((tile) => tile.rank).sort((a, b) => a - b);
    if (
      first.suit === 'z' ||
      !metas.every((tile) => tile.suit === first.suit) ||
      ranks[0] + 1 !== ranks[1] ||
      ranks[1] + 1 !== ranks[2]
    ) {
      errors.push('吃牌必须是同一数牌花色的连续 3 枚');
    }
    return;
  }

  const expectedLength = kind === 'pon' ? 3 : 4;
  if (tiles.length !== expectedLength) {
    errors.push(`${kind} 必须正好 ${expectedLength} 枚`);
    return;
  }
  if (unique.size !== 1) errors.push(`${kind} 必须由相同牌组成`);
}

function validateSanmaTiles(input: ScoreInput, errors: string[]): void {
  if (input.mode !== 'sanma') return;

  const illegalTiles = allPhysicalTiles(input).filter((tile) => {
    const tile34 = tileTo34(tile);
    return tile34 >= 1 && tile34 <= 7;
  });
  if (illegalTiles.length > 0) {
    const labels = [...new Set(illegalTiles.map((tile) => getTileMeta(tile).label))].join('、');
    errors.push(`三麻不使用二至八万：${labels}`);
  }
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
    const base = baseTileCode(tile);
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
  validateSanmaTiles(input, errors);

  const expectedClosed = expectedClosedTileCount(input.melds.length);
  if (input.handTiles.length !== expectedClosed) {
    warnings.push(`当前手牌 ${input.handTiles.length} 枚；完整和牌计算通常需要 ${expectedClosed} 枚（副露按 3 枚折算）`);
  }

  if (isCompleteHandTileCount(input)) {
    if (input.winTile === null) {
      errors.push('请选择和牌张');
    } else if (!input.handTiles.includes(input.winTile)) {
      errors.push('和牌张必须来自闭合手牌');
    }
  }

  if (input.mode === 'sanma') {
    if (input.melds.some((meld) => getMeldKind(meld) === 'chi')) errors.push('三麻快速算分不支持吃牌');
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
  if (input.conditions.renhou && input.seatWind === 'east') errors.push('人和只适用于子家');
  if (input.conditions.renhou && input.conditions.tsumo) errors.push('人和属于荣和条件，不能与自摸同时选择');
  if (input.conditions.renhou && input.melds.length > 0) errors.push('人和不能有副露');
  if (input.conditions.tsubameGaeshi && input.conditions.tsumo) errors.push('燕返属于荣和条件，不能与自摸同时选择');
  if (input.conditions.tsubameGaeshi && input.melds.some((meld) => meld.opened)) {
    errors.push('燕返是门前限定役，不能有明副露');
  }
  if (input.conditions.kanfuri && input.conditions.tsumo) errors.push('杠振属于荣和条件，不能与自摸同时选择');

  return { ok: errors.length === 0, errors, warnings };
}
