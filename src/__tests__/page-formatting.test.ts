import { describe, expect, it } from 'vitest';
import { formatShanten } from '../pages/shared';

describe('page formatting', () => {
  it.each([
    [-1, '和牌'],
    [0, '听牌'],
    [1, '1 向听'],
  ] as const)('formats shanten value %i as %s', (value, expected) => {
    expect(formatShanten(value)).toBe(expected);
  });
});
