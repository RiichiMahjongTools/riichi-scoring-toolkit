import { Shanten } from "./shanten";

export interface EffectiveTile {
  tile_34: number;
  remaining_count: number;
}

export interface HandEfficiency {
  shanten: number;
  effective_tiles: EffectiveTile[];
  total_effective_tiles: number;
}

export class EffectiveTiles {
  static calculate(
    tiles_34: ArrayLike<number>,
    is_three_player = false
  ): HandEfficiency {
    const counts = EffectiveTiles._normalize_tiles(tiles_34);
    const countOfTiles = EffectiveTiles._count_tiles(counts);
    const shanten = countOfTiles === 0
      ? 8
      : Shanten.calculate_shanten(counts, true, true, is_three_player);

    if (shanten < Shanten.TENPAI_STATE || countOfTiles === 0) {
      return { shanten, effective_tiles: [], total_effective_tiles: 0 };
    }

    let effectiveTiles: EffectiveTile[] = [];
    if (countOfTiles % 3 === 1) {
      effectiveTiles = EffectiveTiles._effective_tiles_for_draw(counts, shanten, is_three_player);
    } else if (countOfTiles % 3 === 2) {
      effectiveTiles = EffectiveTiles._effective_tiles_after_discard(counts, is_three_player);
    }

    return {
      shanten,
      effective_tiles: effectiveTiles,
      total_effective_tiles: effectiveTiles.reduce((sum, tile) => sum + tile.remaining_count, 0)
    };
  }

  static _normalize_tiles(tiles_34: ArrayLike<number>): number[] {
    return Array.from({ length: 34 }, (_, i) => tiles_34[i] ?? 0);
  }

  static _count_tiles(tiles_34: ArrayLike<number>): number {
    return Array.from({ length: 34 }, (_, i) => tiles_34[i] ?? 0).reduce((sum, count) => sum + count, 0);
  }

  static _is_tile_allowed(tile_34: number, is_three_player: boolean): boolean {
    return !is_three_player || tile_34 === 0 || tile_34 >= 8;
  }

  static _remaining_count(tile_34: number, counts: ArrayLike<number>): number {
    return Math.max(0, 4 - (counts[tile_34] ?? 0));
  }

  static _effective_tiles_for_draw(
    counts: readonly number[],
    current_shanten: number,
    is_three_player: boolean
  ): EffectiveTile[] {
    const effectiveTiles: EffectiveTile[] = [];
    for (let tile34 = 0; tile34 < 34; tile34 += 1) {
      if (!EffectiveTiles._is_tile_allowed(tile34, is_three_player)) continue;
      const remainingCount = EffectiveTiles._remaining_count(tile34, counts);
      if (remainingCount <= 0) continue;

      const nextCounts = [...counts];
      nextCounts[tile34] += 1;
      const nextShanten = Shanten.calculate_shanten(nextCounts, true, true, is_three_player);
      if (nextShanten < current_shanten) {
        effectiveTiles.push({ tile_34: tile34, remaining_count: remainingCount });
      }
    }
    return effectiveTiles;
  }

  static _effective_tiles_after_discard(
    counts: readonly number[],
    is_three_player: boolean
  ): EffectiveTile[] {
    const merged = new Map<number, EffectiveTile>();

    for (let discard34 = 0; discard34 < 34; discard34 += 1) {
      if ((counts[discard34] ?? 0) <= 0) continue;

      const afterDiscard = [...counts];
      afterDiscard[discard34] -= 1;
      const afterDiscardShanten = Shanten.calculate_shanten(afterDiscard, true, true, is_three_player);
      const effectiveTiles = EffectiveTiles._effective_tiles_for_draw(
        afterDiscard,
        afterDiscardShanten,
        is_three_player
      );

      for (const tile of effectiveTiles) {
        const previous = merged.get(tile.tile_34);
        if (!previous || tile.remaining_count > previous.remaining_count) {
          merged.set(tile.tile_34, tile);
        }
      }
    }

    return [...merged.values()].sort((left, right) => left.tile_34 - right.tile_34);
  }
}
