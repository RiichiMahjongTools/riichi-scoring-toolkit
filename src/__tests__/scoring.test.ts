import { describe, expect, it } from 'vitest';
import { calculateScoreOrEfficiency } from '../domain/scoring';
import { parseTileCodes, type TileCode } from '../domain/tiles';
import { DEFAULT_SCORE_CONDITIONS, type ScoreInput } from '../domain/validation';

function scoreInput(codes: TileCode[], overrides: Partial<ScoreInput> = {}): ScoreInput {
  const handTiles = parseTileCodes(codes);
  return {
    mode: 'yonma',
    handTiles,
    winTile: handTiles[handTiles.length - 1] ?? null,
    melds: [],
    doraIndicators: [],
    uraDoraIndicators: [],
    northDoraCount: 0,
    roundWind: 'east',
    seatWind: 'south',
    honba: 0,
    doubleWindPairTwoFu: false,
    conditions: { ...DEFAULT_SCORE_CONDITIONS },
    ...overrides,
  };
}

describe('quick scoring engine', () => {
  it('returns a scoring result with red dora counted as dora han', () => {
    const result = calculateScoreOrEfficiency(
      scoreInput(['m2', 'm3', 'm4', 'm4', 'm5r', 'm6', 'p2', 'p3', 'p4', 's2', 's3', 's4', 'p5', 'p5']),
    );

    expect(result.kind).toBe('score');
    if (result.kind !== 'score') return;
    expect(result.result.valid).toBe(true);
    expect(result.result.yaku.some((yaku) => yaku.name === '赤宝牌' && yaku.han === 1)).toBe(true);
    expect(result.result.han).toBeGreaterThanOrEqual(2);
    expect(result.result.cost?.main).toBeGreaterThan(0);
  });

  it('routes non-complete input to hand-efficiency output with warnings', () => {
    const result = calculateScoreOrEfficiency(
      scoreInput(['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9']),
    );

    expect(result.kind).toBe('efficiency');
    if (result.kind !== 'efficiency') return;
    expect(result.result.shanten).toBeGreaterThanOrEqual(0);
    expect(result.result.effective_tiles.length).toBeGreaterThan(0);
    expect(result.result.warnings.length).toBeGreaterThan(0);
  });

  it('uses two payer total gain for sanma tsumo-loss', () => {
    const result = calculateScoreOrEfficiency(
      scoreInput(
        ['p2', 'p3', 'p4', 'p6', 'p7', 'p8', 's2', 's3', 's4', 's6', 's7', 's8', 'p5', 'p5'],
        {
          mode: 'sanma',
          conditions: { ...DEFAULT_SCORE_CONDITIONS, tsumo: true },
        },
      ),
    );

    expect(result.kind).toBe('score');
    if (result.kind !== 'score') return;
    const cost = result.result.cost;
    expect(cost?.main).toBeGreaterThan(0);
    expect(cost?.additional).toBeGreaterThan(0);
    expect(cost?.total).toBe((cost?.main ?? 0) + (cost?.additional ?? 0));
  });
});
