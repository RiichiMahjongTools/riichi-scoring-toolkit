import { describe, expect, it } from 'vitest';
import { DEFAULT_SCORE_CONDITIONS, validateScoreInput, type ScoreInput } from '../domain/validation';
import {
  countRedDora,
  parseTileCodes,
  tileAssetFilename,
  tileLabel,
  type TileCode,
} from '../domain/tiles';

function inputWithHand(codes: TileCode[]): ScoreInput {
  return {
    mode: 'yonma',
    handTiles: parseTileCodes(codes),
    melds: [],
    doraIndicators: [],
    uraDoraIndicators: [],
    northDoraCount: 0,
    roundWind: 'east',
    seatWind: 'south',
    honba: 0,
    doubleWindPairTwoFu: false,
    conditions: { ...DEFAULT_SCORE_CONDITIONS },
  };
}

describe('tiles and validation', () => {
  it('maps red fives and honors to labels and asset filenames', () => {
    expect(tileLabel('m5r')).toBe('赤五万');
    expect(tileAssetFilename('m5r')).toBe('Man5-Dora.png');
    expect(tileAssetFilename('z3')).toBe('Shaa.png');
  });

  it('counts red dora while enforcing physical five-tile limits', () => {
    const hand = inputWithHand(['m5', 'm5', 'm5', 'm5', 'm5r']);
    const result = validateScoreInput(hand);
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes('m5'))).toBe(true);
    expect(countRedDora(hand.handTiles)).toBe(1);
  });

  it('counts sanma north dora against physical north tile limit', () => {
    const input = inputWithHand(['z4', 'z4', 'z4', 'z4']);
    input.mode = 'sanma';
    input.northDoraCount = 1;
    const result = validateScoreInput(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes('z4'))).toBe(true);
  });
});
