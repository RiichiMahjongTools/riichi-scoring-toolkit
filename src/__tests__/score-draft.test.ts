import { describe, expect, it } from 'vitest';

import {
  applyScoreDraftTileImport,
  clearScoreDraft,
  createDefaultScoreDraft,
  loadScoreDraft,
  saveScoreDraft,
  scoreDraftStorageKey,
  type ScoreDraftStorage,
  type ScoreDraftV1,
} from '../pages/scoreDraft';

class MemoryStorage implements ScoreDraftStorage {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

function exampleDraft(): ScoreDraftV1 {
  return {
    ...createDefaultScoreDraft(),
    mode: 'sanma',
    handTiles: ['m1', 'm2', 'm3'],
    winTileIndex: 2,
    melds: [{ kind: 'pon', tiles: ['z1', 'z1', 'z1'] }],
    doraIndicators: ['p5r'],
    uraDoraIndicators: ['s9'],
    roundWind: 'south',
    seatWind: 'west',
    honba: 3,
    northDoraCount: 2,
    doubleWindPairTwoFu: true,
    conditions: {
      ...createDefaultScoreDraft().conditions,
      riichi: true,
      ippatsu: true,
    },
  };
}

describe('score draft persistence', () => {
  it('writes and restores quick and legacy drafts independently', () => {
    const storage = new MemoryStorage();
    const quickDraft = exampleDraft();
    const legacyDraft = { ...exampleDraft(), honba: 7 };

    saveScoreDraft('quick', quickDraft, storage);
    saveScoreDraft('legacy', legacyDraft, storage);

    expect(storage.values.has('mahjong.scoreDraft.quick.v1')).toBe(true);
    expect(storage.values.has('mahjong.scoreDraft.legacy.v1')).toBe(true);
    expect(loadScoreDraft('quick', storage)).toEqual(quickDraft);
    expect(loadScoreDraft('legacy', storage)).toEqual(legacyDraft);
  });

  it('clears a stored draft', () => {
    const storage = new MemoryStorage();
    saveScoreDraft('quick', exampleDraft(), storage);
    clearScoreDraft('quick', storage);
    expect(storage.getItem(scoreDraftStorageKey('quick'))).toBeNull();
    expect(loadScoreDraft('quick', storage)).toEqual(createDefaultScoreDraft());
  });

  it('falls back as a whole for malformed JSON, versions and structures', () => {
    const storage = new MemoryStorage();
    const key = scoreDraftStorageKey('quick');

    storage.setItem(key, '{broken');
    expect(loadScoreDraft('quick', storage)).toEqual(createDefaultScoreDraft());

    storage.setItem(key, JSON.stringify({ ...exampleDraft(), version: 2 }));
    expect(loadScoreDraft('quick', storage)).toEqual(createDefaultScoreDraft());

    storage.setItem(key, JSON.stringify({ ...exampleDraft(), handTiles: ['not-a-tile'] }));
    expect(loadScoreDraft('quick', storage)).toEqual(createDefaultScoreDraft());
  });

  it('silently degrades when storage access throws', () => {
    const failingStorage: ScoreDraftStorage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('full'); },
      removeItem: () => { throw new Error('blocked'); },
    };

    expect(loadScoreDraft('quick', failingStorage)).toEqual(createDefaultScoreDraft());
    expect(() => saveScoreDraft('quick', exampleDraft(), failingStorage)).not.toThrow();
    expect(() => clearScoreDraft('quick', failingStorage)).not.toThrow();
  });

  it('lets recognized tiles replace only the saved hand and winning tile', () => {
    const draft = exampleDraft();
    const merged = applyScoreDraftTileImport(draft, ['p1', 'p2', 'p3', 'z7']);

    expect(merged.handTiles).toEqual(['p1', 'p2', 'p3', 'z7']);
    expect(merged.winTileIndex).toBe(3);
    expect(merged.mode).toBe(draft.mode);
    expect(merged.honba).toBe(draft.honba);
    expect(merged.melds).toEqual(draft.melds);
    expect(merged.conditions).toEqual(draft.conditions);
  });
});
