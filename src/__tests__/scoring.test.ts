import { describe, expect, it } from 'vitest';
import { calculateHandEfficiency } from '../domain/efficiency';
import { calculateScoreOrEfficiency } from '../domain/scoring';
import { parseTileCodes, type TileCode } from '../domain/tiles';
import {
  createMeldInput,
  DEFAULT_SCORE_CONDITIONS,
  isValidEfficiencyTileCount,
  type ScoreInput,
} from '../domain/validation';

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

  it.each([0, 1, 2, 3, 4])(
    'only accepts draw and discard tile counts for %i melds',
    (meldCount) => {
      const completeTileCount = 14 - meldCount * 3;

      expect(isValidEfficiencyTileCount(completeTileCount - 1, meldCount)).toBe(true);
      expect(isValidEfficiencyTileCount(completeTileCount, meldCount)).toBe(true);
      expect(isValidEfficiencyTileCount(completeTileCount - 2, meldCount)).toBe(false);
      expect(isValidEfficiencyTileCount(completeTileCount + 1, meldCount)).toBe(false);
    },
  );

  it('rejects efficiency requests whose tile count implies melds that were not entered', () => {
    const handTiles = parseTileCodes(['m1', 'm2', 'm3', 'm4']);
    const result = calculateScoreOrEfficiency(scoreInput(['m1', 'm2', 'm3', 'm4']));

    expect(result.kind).toBe('invalid');
    if (result.kind !== 'invalid') return;
    expect(result.errors).toEqual([
      '牌数与副露数量不匹配：0 组副露时，牌效计算需要 13 或 14 张闭合手牌，当前 4 张',
    ]);
    expect(() => calculateHandEfficiency({ mode: 'yonma', handTiles })).toThrow(RangeError);
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

  it('automatically applies sanrenkou in legacy mode', () => {
    const melds = [
      createMeldInput('pon', parseTileCodes(['m2', 'm2', 'm2'])),
      createMeldInput('pon', parseTileCodes(['m3', 'm3', 'm3'])),
      createMeldInput('pon', parseTileCodes(['m4', 'm4', 'm4'])),
    ];
    const input = scoreInput(['p7', 'p8', 'p9', 'z1', 'z1'], { melds });
    const standardResult = calculateScoreOrEfficiency(input);

    expect(standardResult.kind).toBe('score');
    if (standardResult.kind !== 'score') return;
    expect(standardResult.result.valid).toBe(false);

    const legacyResult = calculateScoreOrEfficiency(input, { enableLegacyYaku: true });

    expect(legacyResult.kind).toBe('score');
    if (legacyResult.kind !== 'score') return;
    expect(legacyResult.result.valid).toBe(true);
    expect(legacyResult.result.han).toBe(2);
    expect(legacyResult.result.yaku).toContainEqual({
      id: '123',
      name: '三连刻',
      han: 2,
      source: 'hand',
    });
    expect(legacyResult.result.cost?.total).toBeGreaterThan(0);
  });

  it.each([
    { suit: 'p', name: '大车轮' },
    { suit: 'm', name: '大数邻' },
    { suit: 's', name: '大竹林' },
  ] as const)('recognizes $name from the tile pattern in legacy mode', ({ suit, name }) => {
    const codes = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8]
      .map((rank) => `${suit}${rank}` as TileCode);
    const result = calculateScoreOrEfficiency(scoreInput(codes), { enableLegacyYaku: true });

    expect(result.kind).toBe('score');
    if (result.kind !== 'score') return;
    expect(result.result.valid).toBe(true);
    expect(result.result.yaku).toContainEqual({
      id: '109',
      name,
      han: 'yakuman',
      source: 'hand',
    });
  });

  it('automatically applies isshoku yonshun as yakuman in legacy mode', () => {
    const result = calculateScoreOrEfficiency(
      scoreInput(['m1', 'm1', 'm1', 'm1', 'm2', 'm2', 'm2', 'm2', 'm3', 'm3', 'm3', 'm3', 'z1', 'z1']),
      { enableLegacyYaku: true },
    );

    expect(result.kind).toBe('score');
    if (result.kind !== 'score') return;
    expect(result.result.yaku).toContainEqual({
      id: '124',
      name: '一色四顺',
      han: 'yakuman',
      source: 'hand',
    });
  });

  it('recognizes shiisanpuutaa without a standard hand decomposition in legacy mode', () => {
    const input = scoreInput([
      'm1', 'm4', 'm7',
      'p2', 'p5', 'p8',
      's3', 's6', 's9',
      'z1', 'z2', 'z3', 'z4', 'z4',
    ]);
    const standardResult = calculateScoreOrEfficiency(input);
    const legacyResult = calculateScoreOrEfficiency(input, { enableLegacyYaku: true });

    expect(standardResult.kind).toBe('efficiency');
    expect(legacyResult.kind).toBe('score');
    if (legacyResult.kind !== 'score') return;
    expect(legacyResult.result.valid).toBe(true);
    expect(legacyResult.result.fu).toBe(30);
    expect(legacyResult.result.yaku).toContainEqual({
      id: '125',
      name: '十三不塔',
      han: 1,
      source: 'hand',
    });
  });

  it.each([
    { key: 'renhou', name: '人和', han: 5 },
    { key: 'tsubameGaeshi', name: '燕返', han: 1 },
    { key: 'kanfuri', name: '杠振', han: 1 },
  ] as const)('applies manually confirmed event yaku $name', ({ key, name, han }) => {
    const result = calculateScoreOrEfficiency(scoreInput(
      ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'p2', 'p3', 'p4', 's6', 's7', 's8', 'z1', 'z1'],
      { conditions: { ...DEFAULT_SCORE_CONDITIONS, [key]: true } },
    ), { enableLegacyYaku: true });

    expect(result.kind).toBe('score');
    if (result.kind !== 'score') return;
    expect(result.result.valid).toBe(true);
    expect(result.result.yaku).toContainEqual(expect.objectContaining({ name, han, source: 'condition' }));
  });

  it('rejects tsubame gaeshi after an open call', () => {
    const melds = [
      createMeldInput('pon', parseTileCodes(['m2', 'm2', 'm2'])),
      createMeldInput('pon', parseTileCodes(['m3', 'm3', 'm3'])),
      createMeldInput('pon', parseTileCodes(['m4', 'm4', 'm4'])),
    ];
    const result = calculateScoreOrEfficiency(scoreInput(
      ['p7', 'p8', 'p9', 'z1', 'z1'],
      {
        melds,
        conditions: { ...DEFAULT_SCORE_CONDITIONS, tsubameGaeshi: true },
      },
    ), { enableLegacyYaku: true });

    expect(result.kind).toBe('invalid');
    if (result.kind !== 'invalid') return;
    expect(result.errors).toContain('燕返是门前限定役，不能有明副露');
  });
});
