import { ALL_TILE_CODES, type TileCode } from './tiles';

export type RecognitionScoreTarget = 'quick-score' | 'legacy-score';

export function recognitionTilesToHash(
  tiles: readonly TileCode[],
  target: RecognitionScoreTarget = 'quick-score',
) {
  const params = new URLSearchParams({
    tiles: tiles.filter((tile) => ALL_TILE_CODES.includes(tile)).join(','),
  });
  return `#/${target}?${params.toString()}`;
}
