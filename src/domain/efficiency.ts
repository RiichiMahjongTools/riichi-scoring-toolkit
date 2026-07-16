import { EffectiveTiles } from 'mahjong-ts';
import {
  createTile,
  tile34ToBaseCode,
  tileLabel,
  tilesTo34Array,
  type Tile,
} from './tiles';
import {
  expectedClosedTileCount,
  isValidEfficiencyTileCount,
  type MeldInput,
  type ScoreMode,
} from './validation';

export interface EffectiveTile {
  tile: Tile;
  tile_34: number;
  remaining_count: number;
}

export interface EfficiencyResult {
  mode: ScoreMode;
  shanten: number;
  effective_tiles: EffectiveTile[];
  total_effective_tiles: number;
  warnings: string[];
}

export function calculateShanten(tiles: readonly Tile[], mode: ScoreMode = 'yonma'): number {
  return EffectiveTiles.calculate(tilesTo34Array(tiles), mode === 'sanma').shanten;
}

export function calculateHandEfficiency(params: {
  mode: ScoreMode;
  handTiles: readonly Tile[];
  melds?: readonly MeldInput[];
  warnings?: readonly string[];
}): EfficiencyResult {
  const meldCount = params.melds?.length ?? 0;
  if (!isValidEfficiencyTileCount(params.handTiles.length, meldCount)) {
    const completeTileCount = expectedClosedTileCount(meldCount);
    throw new RangeError(
      `牌数与副露数量不匹配：${meldCount} 组副露时，牌效计算需要 ${completeTileCount - 1} 或 ${completeTileCount} 张闭合手牌，当前 ${params.handTiles.length} 张`,
    );
  }

  const warnings = [...(params.warnings ?? [])];

  try {
    const result = EffectiveTiles.calculate(tilesTo34Array(params.handTiles), params.mode === 'sanma');
    return {
      mode: params.mode,
      shanten: result.shanten,
      effective_tiles: result.effective_tiles.map((entry) => ({
        tile: createTile(tile34ToBaseCode(entry.tile_34)),
        tile_34: entry.tile_34,
        remaining_count: entry.remaining_count,
      })),
      total_effective_tiles: result.total_effective_tiles,
      warnings,
    };
  } catch (error) {
    return {
      mode: params.mode,
      shanten: 8,
      effective_tiles: [],
      total_effective_tiles: 0,
      warnings: [...warnings, error instanceof Error ? error.message : '向听计算失败'],
    };
  }
}

export function describeEffectiveTiles(result: EfficiencyResult): string {
  if (result.effective_tiles.length === 0) return '暂无可列出的有效牌';
  return result.effective_tiles
    .map((entry) => `${tileLabel(entry.tile)} ${entry.remaining_count} 枚`)
    .join('、');
}
