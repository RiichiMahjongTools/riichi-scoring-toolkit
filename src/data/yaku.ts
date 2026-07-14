import rawYakuData from './majsoul-yaku-descriptions.json';
import { isTileCode, type TileCode } from '../domain/tiles';

export const YAKU_CATEGORY_ORDER = [
  'one-han',
  'two-han',
  'three-han',
  'six-han',
  'mangan',
  'yakuman',
  'double-yakuman',
  'draw',
] as const;

export type YakuCategory = (typeof YAKU_CATEGORY_ORDER)[number];

export const YAKU_CATEGORY_LABELS: Readonly<Record<YakuCategory, string>> = {
  'one-han': '1番',
  'two-han': '2番',
  'three-han': '3番',
  'six-han': '6番',
  mangan: '满贯',
  yakuman: '役满',
  'double-yakuman': '双倍役满',
  draw: '流局',
};

export type YakuExampleTile = TileCode | 'back';
export type YakuExampleGroups = readonly (readonly YakuExampleTile[])[];

export interface YakuInfo {
  id: string;
  sourceId: number;
  name: string;
  category: YakuCategory;
  description: string;
  note: string;
  exampleGroups: YakuExampleGroups;
}

interface MajsoulYakuEntry {
  id: number;
  category: string;
  mode: string;
  name: string;
  description: string;
  note: string;
  example: string;
}

const CATEGORY_SET = new Set<string>(YAKU_CATEGORY_ORDER);

function isYakuCategory(value: string): value is YakuCategory {
  return CATEGORY_SET.has(value);
}

function parseMajsoulExampleGroup(group: string, example: string): YakuExampleTile[] {
  const tiles: YakuExampleTile[] = [];

  for (let offset = 0; offset < group.length;) {
    if (group[offset] === 'b') {
      tiles.push('back');
      offset += 1;
      continue;
    }

    const token = group.slice(offset, offset + 2);
    const match = token.match(/^([0-9])([mpsz])$/);
    if (!match) {
      throw new Error(`Invalid Mahjong Soul yaku example token at ${offset}: ${example}`);
    }

    const rank = Number(match[1]);
    const suit = match[2];
    const tile = rank === 0 ? `${suit}5r` : `${suit}${rank}`;
    if (!isTileCode(tile)) {
      throw new Error(`Unsupported Mahjong Soul yaku example tile ${token}: ${example}`);
    }

    tiles.push(tile);
    offset += 2;
  }

  if (tiles.length === 0) {
    throw new Error(`Empty Mahjong Soul yaku example group: ${example}`);
  }

  return tiles;
}

export function parseMajsoulYakuExample(example: string): YakuExampleGroups {
  const normalized = example.trim();
  if (!normalized) return [];

  return normalized
    .split('|')
    .map((group) => parseMajsoulExampleGroup(group, normalized));
}

const SOURCE_ENTRIES = rawYakuData.entries as readonly MajsoulYakuEntry[];

export const YAKU_LIST: readonly YakuInfo[] = SOURCE_ENTRIES
  .filter((entry) => entry.mode === 'riichi')
  .map((entry) => {
    if (!isYakuCategory(entry.category)) {
      throw new Error(`Unsupported riichi yaku category ${entry.category} for ${entry.name}`);
    }

    return {
      id: String(entry.id),
      sourceId: entry.id,
      name: entry.name,
      category: entry.category,
      description: entry.description,
      note: entry.note,
      exampleGroups: parseMajsoulYakuExample(entry.example),
    };
  });

export const LEGACY_YAKU_ALIASES: Readonly<Record<string, string>> = {
  riichi: '101',
  'menzen-tsumo': '103',
  tanyao: '102',
  pinfu: '107',
  iipeikou: '108',
  yakuhai: '106',
  ippatsu: '113',
  haitei: '111',
  houtei: '112',
  'rinshan-kaihou': '110',
  chankan: '109',
  'double-riichi': '201',
  chiitoitsu: '208',
  'sanshoku-doujun': '211',
  ikkitsuukan: '210',
  chanta: '209',
  toitoi: '204',
  sanankou: '205',
  sankantsu: '203',
  'sanshoku-doukou': '202',
  shousangen: '206',
  honroutou: '207',
  honitsu: '303',
  junchan: '302',
  ryanpeikou: '301',
  chinitsu: '401',
  kokushi: '608',
  suuankou: '604',
  daisangen: '603',
  shousuushi: '609',
  daisuushi: '704',
  tsuuiisou: '605',
  ryuuiisou: '606',
  chinroutou: '607',
  chuuren: '611',
  suukantsu: '610',
  tenhou: '601',
  chiihou: '602',
};

const YAKU_BY_ID = new Map(YAKU_LIST.map((yaku) => [yaku.id, yaku]));

export function findYakuById(id: string): YakuInfo | undefined {
  const requestedId = id.trim();
  return YAKU_BY_ID.get(LEGACY_YAKU_ALIASES[requestedId] ?? requestedId);
}
