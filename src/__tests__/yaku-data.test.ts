import { describe, expect, it } from 'vitest';

import rawYakuData from '../data/majsoul-yaku-descriptions.json';
import {
  LEGACY_YAKU_ALIASES,
  YAKU_CATEGORY_ORDER,
  YAKU_LIST,
  findYakuById,
  parseMajsoulYakuExample,
  type YakuCategory,
} from '../data/yaku';
import { baseTileCode, isTileCode } from '../domain/tiles';

const EXPECTED_CATEGORY_COUNTS: Readonly<Record<YakuCategory, number>> = {
  'one-han': 19,
  'two-han': 13,
  'three-han': 4,
  'six-han': 1,
  mangan: 3,
  yakuman: 16,
  'double-yakuman': 5,
  draw: 4,
};

describe('Mahjong Soul riichi yaku data', () => {
  it('maps the exact 65 riichi entries in official source order', () => {
    const sourceEntries = rawYakuData.entries.filter((entry) => entry.mode === 'riichi');

    expect(YAKU_LIST).toHaveLength(65);
    expect(YAKU_LIST.map((yaku) => ({
      id: yaku.sourceId,
      category: yaku.category,
      name: yaku.name,
      description: yaku.description,
      note: yaku.note,
    }))).toEqual(sourceEntries.map((entry) => ({
      id: entry.id,
      category: entry.category,
      name: entry.name,
      description: entry.description,
      note: entry.note,
    })));
  });

  it('uses the expected eight category counts without Sichuan entries', () => {
    for (const category of YAKU_CATEGORY_ORDER) {
      expect(YAKU_LIST.filter((yaku) => yaku.category === category), category)
        .toHaveLength(EXPECTED_CATEGORY_COUNTS[category]);
    }

    const sichuanIds = new Set(
      rawYakuData.entries
        .filter((entry) => entry.mode === 'sichuan')
        .map((entry) => entry.id),
    );
    expect(YAKU_LIST.some((yaku) => sichuanIds.has(yaku.sourceId))).toBe(false);
  });
});

describe('Mahjong Soul yaku example parser', () => {
  it('parses every official example into valid internal tile codes', () => {
    const emptyExamples: string[] = [];

    for (const yaku of YAKU_LIST) {
      if (yaku.exampleGroups.length === 0) {
        emptyExamples.push(yaku.name);
        continue;
      }

      const physicalCounts = new Map<string, number>();
      for (const group of yaku.exampleGroups) {
        expect(group.length, yaku.name).toBeGreaterThan(0);

        for (const tile of group) {
          if (tile === 'back') continue;

          expect(isTileCode(tile), `${yaku.name}: ${tile}`).toBe(true);
          const base = baseTileCode(tile);
          physicalCounts.set(base, (physicalCounts.get(base) ?? 0) + 1);
        }
      }

      for (const [tile, count] of physicalCounts) {
        expect(count, `${yaku.name}: ${tile}`).toBeLessThanOrEqual(4);
      }
    }

    expect(emptyExamples).toEqual(['四家立直']);
  });

  it('preserves groups, converts red fives, and maps concealed indicators to tile backs', () => {
    expect(parseMajsoulYakuExample('3sbbbb|4s')).toEqual([
      ['s3', 'back', 'back', 'back', 'back'],
      ['s4'],
    ]);
    expect(parseMajsoulYakuExample('0m|0p|0s')).toEqual([
      ['m5r'],
      ['p5r'],
      ['s5r'],
    ]);
    expect(findYakuById('114')?.exampleGroups).toEqual(parseMajsoulYakuExample('3sbbbb|4s'));
    expect(findYakuById('115')?.exampleGroups.flat()).toEqual(['m5r', 'p5r', 's5r']);
  });

  it('keeps long examples intact and rejects malformed tokens', () => {
    expect(findYakuById('501')?.exampleGroups.flat()).toHaveLength(18);
    expect(findYakuById('610')?.exampleGroups.flat()).toHaveLength(18);
    expect(parseMajsoulYakuExample('')).toEqual([]);
    expect(() => parseMajsoulYakuExample('1m||2m')).toThrow(/Empty Mahjong Soul yaku example group/);
    expect(() => parseMajsoulYakuExample('5z?')).toThrow(/Invalid Mahjong Soul yaku example token/);
  });
});

describe('yaku lookup aliases', () => {
  it('resolves every official numeric id', () => {
    for (const yaku of YAKU_LIST) {
      expect(findYakuById(String(yaku.sourceId))).toBe(yaku);
    }
  });

  it('keeps all 38 legacy slugs as aliases', () => {
    expect(Object.keys(LEGACY_YAKU_ALIASES)).toHaveLength(38);

    for (const [slug, sourceId] of Object.entries(LEGACY_YAKU_ALIASES)) {
      expect(findYakuById(slug), slug).toBe(findYakuById(sourceId));
    }

    expect(findYakuById('yakuhai')?.sourceId).toBe(106);
    expect(findYakuById('104')?.name).toBe('役牌：自风牌');
    expect(findYakuById('105')?.name).toBe('役牌：场风牌');
  });
});
