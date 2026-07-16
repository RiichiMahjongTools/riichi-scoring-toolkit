import { describe, expect, it } from 'vitest';

import {
  buildQuickEntryCandidates,
  canUseTileCodes,
  type BuildQuickEntryCandidatesOptions,
  type TileCode,
} from '../domain';

function candidates(
  anchor: TileCode,
  overrides: Partial<BuildQuickEntryCandidatesOptions> = {},
) {
  return buildQuickEntryCandidates({
    target: 'hand',
    anchor,
    mode: 'yonma',
    inventory: [],
    handTileCount: 0,
    meldCount: 0,
    ...overrides,
  });
}

describe('quick entry candidates', () => {
  it('builds normal and red-five sequences from the selected starting tile', () => {
    const sequences = candidates('m3').filter((candidate) => candidate.kind === 'sequence');

    expect(sequences.map((candidate) => candidate.tiles)).toEqual([
      ['m3', 'm4', 'm5'],
      ['m3', 'm4', 'm5r'],
    ]);
  });

  it('filters the red-five sequence when that red five is already used', () => {
    const sequences = candidates('m3', { inventory: ['m5r'] }).filter(
      (candidate) => candidate.kind === 'sequence',
    );

    expect(sequences.map((candidate) => candidate.tiles)).toEqual([['m3', 'm4', 'm5']]);
  });

  it('lets the active red anchor participate in one red candidate and never duplicates it', () => {
    const result = candidates('m5r');

    expect(result.find((candidate) => candidate.id === 'sequence-red-five')?.tiles).toEqual([
      'm5r',
      'm6',
      'm7',
    ]);
    expect(result.find((candidate) => candidate.id === 'pair')?.tiles).toEqual(['m5r', 'm5']);
    expect(result.some((candidate) => candidate.id === 'closed-kan')).toBe(false);
    expect(candidates('m5r', { target: 'meld' }).find((candidate) => candidate.id === 'closed-kan')?.tiles).toEqual([
      'm5r',
      'm5',
      'm5',
      'm5',
    ]);
  });

  it('omits sequences for honors, ranks eight and nine, and illegal sanma man tiles', () => {
    expect(candidates('z1').some((candidate) => candidate.kind === 'sequence')).toBe(false);
    expect(candidates('p8').some((candidate) => candidate.kind === 'sequence')).toBe(false);
    expect(candidates('m1', { mode: 'sanma' }).some((candidate) => candidate.kind === 'sequence')).toBe(false);
    expect(candidates('p3', { mode: 'sanma' }).some((candidate) => candidate.kind === 'sequence')).toBe(true);
  });

  it('routes hand and meld candidates to their intended destinations', () => {
    const hand = candidates('p4');
    const meld = candidates('p4', { target: 'meld' });

    expect(hand.find((candidate) => candidate.kind === 'pair')?.destination).toBe('hand');
    expect(hand.find((candidate) => candidate.kind === 'triplet')?.destination).toBe('hand');
    expect(hand.some((candidate) => candidate.kind === 'closedKan')).toBe(false);
    expect(hand.some((candidate) => candidate.kind === 'openKan')).toBe(false);
    expect(meld.some((candidate) => candidate.kind === 'pair')).toBe(false);
    expect(meld.find((candidate) => candidate.kind === 'sequence')?.meldKind).toBe('chi');
    expect(meld.find((candidate) => candidate.kind === 'triplet')?.meldKind).toBe('pon');
    expect(meld.find((candidate) => candidate.kind === 'closedKan')?.meldKind).toBe('closedKan');
    expect(meld.find((candidate) => candidate.kind === 'openKan')?.meldKind).toBe('openKan');
  });

  it('filters physical-copy, red-five, hand-capacity, and meld-count violations', () => {
    expect(candidates('z1', { inventory: ['z1', 'z1', 'z1'] }).some((candidate) => candidate.kind === 'pair')).toBe(
      false,
    );
    expect(canUseTileCodes(['s5r'], ['s5r'], 'yonma')).toBe(false);
    expect(candidates('s2', { handTileCount: 13 })).toHaveLength(0);
    expect(candidates('s2', { target: 'meld', meldCount: 4, handTileCount: 2 })).toHaveLength(0);
    expect(
      candidates('s2', {
        target: 'meld',
        meldCount: 4,
        handTileCount: 2,
        replacingMeld: true,
      }).length,
    ).toBeGreaterThan(0);
  });
});
