import MajiangPkg from '@kobalab/majiang-core';
import {
  ALL_BASE_TILE_CODES,
  baseTileCode,
  createTile,
  tileLabel,
  type BaseTileCode,
  type Tile,
} from './tiles';
import type { MeldInput, ScoreMode } from './validation';

type ShoupaiInstance = unknown;

interface MajiangRuntime {
  Shoupai: {
    fromString(paistr: string): ShoupaiInstance;
  };
  Util: {
    xiangting(shoupai: ShoupaiInstance): number;
    tingpai(shoupai: ShoupaiInstance): string[] | null;
  };
}

export interface EffectiveTile {
  tile: Tile;
  remainingCount: number;
}

export interface EfficiencyResult {
  mode: ScoreMode;
  shanten: number;
  effectiveTiles: EffectiveTile[];
  totalEffectiveTileCount: number;
  warnings: string[];
}

const Majiang = MajiangPkg as unknown as MajiangRuntime;
const BASE_CODE_TO_INDEX = new Map<BaseTileCode, number>(ALL_BASE_TILE_CODES.map((code, index) => [code, index]));

function emptyCounts(): number[] {
  return Array.from({ length: 34 }, () => 0);
}

function tilesToCounts(tiles: readonly Tile[]): number[] {
  const counts = emptyCounts();
  for (const tile of tiles) {
    const index = BASE_CODE_TO_INDEX.get(baseTileCode(tile.code));
    if (index !== undefined) counts[index] += 1;
  }
  return counts;
}

function countTiles(tiles: readonly Tile[], melds: readonly MeldInput[]): number {
  return tiles.length + melds.length * 3;
}

function tileToMajiangPart(tile: Tile): string {
  if (tile.suit === 'z') return `z${tile.rank}`;
  return `${tile.suit}${tile.red ? 0 : tile.rank}`;
}

function tilesToShoupaiString(tiles: readonly Tile[]): string {
  const groups: Record<'m' | 'p' | 's' | 'z', string[]> = { m: [], p: [], s: [], z: [] };
  for (const tile of tiles) {
    const part = tileToMajiangPart(tile);
    groups[part[0] as 'm' | 'p' | 's' | 'z'].push(part[1]);
  }

  return (['m', 'p', 's', 'z'] as const)
    .map((suit) => {
      const ranks = groups[suit];
      if (ranks.length === 0) return '';
      ranks.sort((a, b) => Number(a.replace('0', '5')) - Number(b.replace('0', '5')));
      return `${suit}${ranks.join('')}`;
    })
    .join('');
}

function makeShoupai(tiles: readonly Tile[]): ShoupaiInstance {
  return Majiang.Shoupai.fromString(tilesToShoupaiString(tiles));
}

function majiangCodeToTile(code: string): Tile | null {
  const suit = code[0];
  const rank = code[1];
  const tileCode = `${suit}${rank}` as BaseTileCode;
  return ALL_BASE_TILE_CODES.includes(tileCode) ? createTile(tileCode) : null;
}

function remainingCountFor(baseCode: BaseTileCode, counts: readonly number[]): number {
  const index = BASE_CODE_TO_INDEX.get(baseCode);
  if (index === undefined) return 0;
  return Math.max(0, 4 - counts[index]);
}

function effectiveTilesForDraw(tiles: readonly Tile[]): EffectiveTile[] {
  const counts = tilesToCounts(tiles);
  const shoupai = makeShoupai(tiles);
  const codes = Majiang.Util.tingpai(shoupai) ?? [];
  return codes
    .map(majiangCodeToTile)
    .filter((tile): tile is Tile => tile !== null)
    .map((tile) => ({
      tile,
      remainingCount: remainingCountFor(baseTileCode(tile.code), counts),
    }))
    .filter((entry) => entry.remainingCount > 0)
    .sort((a, b) => a.tile.code.localeCompare(b.tile.code));
}

function mergeEffectiveTiles(groups: readonly EffectiveTile[][]): EffectiveTile[] {
  const merged = new Map<BaseTileCode, EffectiveTile>();
  for (const tile of groups.flat()) {
    const key = baseTileCode(tile.tile.code);
    const previous = merged.get(key);
    if (!previous || tile.remainingCount > previous.remainingCount) merged.set(key, tile);
  }
  return [...merged.values()].sort((a, b) => a.tile.code.localeCompare(b.tile.code));
}

function removeTileAt(tiles: readonly Tile[], indexToRemove: number): Tile[] {
  return tiles.filter((_, index) => index !== indexToRemove);
}

export function calculateShanten(tiles: readonly Tile[], melds: readonly MeldInput[] = []): number {
  if (melds.length > 0) {
    // Majiang.Shoupai meld strings need caller/discard direction. MVP keeps meld-aware
    // quick scoring in riichi-mahjong; efficiency uses concealed tiles plus a warning.
    return Majiang.Util.xiangting(makeShoupai(tiles));
  }
  return Majiang.Util.xiangting(makeShoupai(tiles));
}

export function calculateHandEfficiency(params: {
  mode: ScoreMode;
  handTiles: readonly Tile[];
  melds?: readonly MeldInput[];
  warnings?: readonly string[];
}): EfficiencyResult {
  const melds = params.melds ?? [];
  const warnings = [...(params.warnings ?? [])];
  const tileCount = countTiles(params.handTiles, melds);
  const shanten = calculateShanten(params.handTiles, melds);

  if (melds.length > 0) {
    warnings.push('当前牌效结果暂按闭合手牌估算，副露只参与快速算分校验');
  }

  let effectiveTiles: EffectiveTile[];
  if (tileCount % 3 === 1) {
    effectiveTiles = effectiveTilesForDraw(params.handTiles);
  } else if (tileCount % 3 === 2) {
    warnings.push('当前张数按“切一张后的进张”估算有效牌');
    effectiveTiles = mergeEffectiveTiles(params.handTiles.map((_, index) => effectiveTilesForDraw(removeTileAt(params.handTiles, index))));
  } else {
    warnings.push('当前张数不适合标准摸牌进张计算，仅显示向听数');
    effectiveTiles = [];
  }

  return {
    mode: params.mode,
    shanten,
    effectiveTiles,
    totalEffectiveTileCount: effectiveTiles.reduce((sum, tile) => sum + tile.remainingCount, 0),
    warnings,
  };
}

export function describeEffectiveTiles(result: EfficiencyResult): string {
  if (result.effectiveTiles.length === 0) return '暂无可列出的有效牌';
  return result.effectiveTiles.map((entry) => `${tileLabel(entry.tile)} ${entry.remainingCount} 枚`).join('、');
}
