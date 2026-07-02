import {
  AKA_DORAS,
  EAST,
  FIVE_RED_MAN,
  FIVE_RED_PIN,
  FIVE_RED_SOU,
  NORTH,
  SOUTH,
  TilesConverter,
  WEST,
} from 'mahjong-ts';

export type NumberSuit = 'm' | 'p' | 's';
export type HonorSuit = 'z';
export type TileSuit = NumberSuit | HonorSuit;
export type TileRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type HonorRank = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Wind = 'east' | 'south' | 'west' | 'north';

export type NumberTileCode =
  | 'm1'
  | 'm2'
  | 'm3'
  | 'm4'
  | 'm5'
  | 'm5r'
  | 'm6'
  | 'm7'
  | 'm8'
  | 'm9'
  | 'p1'
  | 'p2'
  | 'p3'
  | 'p4'
  | 'p5'
  | 'p5r'
  | 'p6'
  | 'p7'
  | 'p8'
  | 'p9'
  | 's1'
  | 's2'
  | 's3'
  | 's4'
  | 's5'
  | 's5r'
  | 's6'
  | 's7'
  | 's8'
  | 's9';

export type HonorTileCode = 'z1' | 'z2' | 'z3' | 'z4' | 'z5' | 'z6' | 'z7';
export type TileCode = NumberTileCode | HonorTileCode;
export type BaseTileCode = Exclude<TileCode, 'm5r' | 'p5r' | 's5r'>;

export type Tile = number;

export interface TileMeta {
  code: TileCode;
  baseCode: BaseTileCode;
  tile34: number;
  suit: TileSuit;
  rank: TileRank | HonorRank;
  red: boolean;
  label: string;
  shortLabel: string;
  assetFilename: string;
  sortKey: number;
}

const NUMBER_LABELS: Record<NumberSuit, string> = {
  m: '万',
  p: '筒',
  s: '索',
};

const NUMBER_ASSET_PREFIX: Record<NumberSuit, string> = {
  m: 'Man',
  p: 'Pin',
  s: 'Sou',
};

const HONORS: Record<
  HonorTileCode,
  {
    tile34: number;
    rank: HonorRank;
    label: string;
    shortLabel: string;
    assetFilename: string;
    wind?: Wind;
  }
> = {
  z1: { tile34: EAST, rank: 1, label: '东', shortLabel: '东', assetFilename: 'Ton.png', wind: 'east' },
  z2: { tile34: SOUTH, rank: 2, label: '南', shortLabel: '南', assetFilename: 'Nan.png', wind: 'south' },
  z3: { tile34: WEST, rank: 3, label: '西', shortLabel: '西', assetFilename: 'Shaa.png', wind: 'west' },
  z4: { tile34: NORTH, rank: 4, label: '北', shortLabel: '北', assetFilename: 'Pei.png', wind: 'north' },
  z5: { tile34: 31, rank: 5, label: '白', shortLabel: '白', assetFilename: 'Haku.png' },
  z6: { tile34: 32, rank: 6, label: '发', shortLabel: '发', assetFilename: 'Hatsu.png' },
  z7: { tile34: 33, rank: 7, label: '中', shortLabel: '中', assetFilename: 'Chun.png' },
};

const BASE_CODES: BaseTileCode[] = [
  'm1',
  'm2',
  'm3',
  'm4',
  'm5',
  'm6',
  'm7',
  'm8',
  'm9',
  'p1',
  'p2',
  'p3',
  'p4',
  'p5',
  'p6',
  'p7',
  'p8',
  'p9',
  's1',
  's2',
  's3',
  's4',
  's5',
  's6',
  's7',
  's8',
  's9',
  'z1',
  'z2',
  'z3',
  'z4',
  'z5',
  'z6',
  'z7',
];

export const ALL_BASE_TILE_CODES: readonly BaseTileCode[] = BASE_CODES;
export const ALL_TILE_CODES: readonly TileCode[] = [
  'm1',
  'm2',
  'm3',
  'm4',
  'm5',
  'm5r',
  'm6',
  'm7',
  'm8',
  'm9',
  'p1',
  'p2',
  'p3',
  'p4',
  'p5',
  'p5r',
  'p6',
  'p7',
  'p8',
  'p9',
  's1',
  's2',
  's3',
  's4',
  's5',
  's5r',
  's6',
  's7',
  's8',
  's9',
  'z1',
  'z2',
  'z3',
  'z4',
  'z5',
  'z6',
  'z7',
];

export const RED_FIVE_CODES: readonly TileCode[] = ['m5r', 'p5r', 's5r'];

const TILE_34_TO_BASE_CODE = new Map<number, BaseTileCode>(BASE_CODES.map((code, tile34) => [tile34, code]));
const BASE_CODE_TO_TILE_34 = new Map<BaseTileCode, number>(BASE_CODES.map((code, tile34) => [code, tile34]));
const RED_CODE_TO_136: Record<'m5r' | 'p5r' | 's5r', number> = {
  m5r: FIVE_RED_MAN,
  p5r: FIVE_RED_PIN,
  s5r: FIVE_RED_SOU,
};
const RED_TILE_136_TO_CODE = new Map<number, TileCode>([
  [FIVE_RED_MAN, 'm5r'],
  [FIVE_RED_PIN, 'p5r'],
  [FIVE_RED_SOU, 's5r'],
]);

export function isTileCode(value: string): value is TileCode {
  return (ALL_TILE_CODES as readonly string[]).includes(value);
}

export function isRedFive(tileOrCode: Tile | TileCode): boolean {
  if (typeof tileOrCode === 'number') return AKA_DORAS.has(tileOrCode);
  return tileOrCode === 'm5r' || tileOrCode === 'p5r' || tileOrCode === 's5r';
}

export function tileTo34(tile: Tile): number {
  return Math.floor(tile / 4);
}

export function tile34ToBaseCode(tile34: number): BaseTileCode {
  const code = TILE_34_TO_BASE_CODE.get(tile34);
  if (!code) throw new Error(`Unsupported mahjong-ts tile_34: ${tile34}`);
  return code;
}

export function tileCodeTo34(code: TileCode): number {
  const base = baseTileCode(code);
  const tile34 = BASE_CODE_TO_TILE_34.get(base);
  if (tile34 === undefined) throw new Error(`Unsupported tile code: ${code}`);
  return tile34;
}

export function tileToCode(tile: Tile): TileCode {
  const red = RED_TILE_136_TO_CODE.get(tile);
  if (red) return red;
  return tile34ToBaseCode(tileTo34(tile));
}

export function baseTileCode(tileOrCode: Tile | TileCode): BaseTileCode {
  const code = typeof tileOrCode === 'number' ? tileToCode(tileOrCode) : tileOrCode;
  if (code === 'm5r') return 'm5';
  if (code === 'p5r') return 'p5';
  if (code === 's5r') return 's5';
  return code;
}

function allocateTile136(code: TileCode, usedByBase: Map<BaseTileCode, Set<number>>): Tile {
  const baseCode = baseTileCode(code);
  const tile34 = tileCodeTo34(code);
  const used = usedByBase.get(baseCode) ?? new Set<number>();
  usedByBase.set(baseCode, used);

  if (code === 'm5r' || code === 'p5r' || code === 's5r') {
    const redTile = RED_CODE_TO_136[code];
    used.add(redTile);
    return redTile;
  }

  const firstCopy = tile34 * 4;
  const offsets = baseCode === 'm5' || baseCode === 'p5' || baseCode === 's5' ? [1, 2, 3] : [0, 1, 2, 3];
  for (const offset of offsets) {
    const tile = firstCopy + offset;
    if (!used.has(tile)) {
      used.add(tile);
      return tile;
    }
  }

  return firstCopy + 3;
}

export function createTile(code: TileCode): Tile {
  return parseTileCodes([code])[0];
}

export function tileFromParts(suit: NumberSuit, rank: TileRank, red?: boolean): Tile;
export function tileFromParts(suit: HonorSuit, rank: HonorRank, red?: false): Tile;
export function tileFromParts(suit: TileSuit, rank: TileRank | HonorRank, red = false): Tile {
  if (suit === 'z') {
    const code = `z${rank}`;
    if (!isTileCode(code) || red) throw new Error(`Invalid honor tile ${code}`);
    return createTile(code);
  }
  const code = `${suit}${rank}${red ? 'r' : ''}`;
  if (!isTileCode(code)) throw new Error(`Invalid tile ${code}`);
  return createTile(code);
}

export function getTileMeta(tileOrCode: Tile | TileCode): TileMeta {
  const code = typeof tileOrCode === 'number' ? tileToCode(tileOrCode) : tileOrCode;
  const baseCode = baseTileCode(code);
  const tile34 = tileCodeTo34(code);
  const suit = baseCode[0] as TileSuit;
  const rank = Number(baseCode[1]) as TileRank | HonorRank;
  const red = isRedFive(code);

  if (suit === 'z') {
    const honor = HONORS[baseCode as HonorTileCode];
    return {
      code,
      baseCode,
      tile34,
      suit,
      rank,
      red,
      label: honor.label,
      shortLabel: honor.shortLabel,
      assetFilename: honor.assetFilename,
      sortKey: tileSortKey(code),
    };
  }

  const label = red ? `赤五${NUMBER_LABELS[suit]}` : `${rank}${NUMBER_LABELS[suit]}`;
  const assetFilename = `${NUMBER_ASSET_PREFIX[suit]}${rank}${red ? '-Dora' : ''}.png`;
  return {
    code,
    baseCode,
    tile34,
    suit,
    rank,
    red,
    label,
    shortLabel: red ? `赤5${NUMBER_LABELS[suit]}` : `${rank}${NUMBER_LABELS[suit]}`,
    assetFilename,
    sortKey: tileSortKey(code),
  };
}

export function tileLabel(tileOrCode: Tile | TileCode): string {
  return getTileMeta(tileOrCode).label;
}

export function tileAssetFilename(tileOrCode: Tile | TileCode): string {
  return getTileMeta(tileOrCode).assetFilename;
}

export function tileSortKey(tileOrCode: Tile | TileCode): number {
  const code = typeof tileOrCode === 'number' ? tileToCode(tileOrCode) : tileOrCode;
  const base = baseTileCode(code);
  const suit = base[0] as TileSuit;
  const rank = Number(base[1]);
  const suitOffset: Record<TileSuit, number> = { m: 0, p: 10, s: 20, z: 30 };
  return suitOffset[suit] + rank + (isRedFive(code) ? 0.1 : 0);
}

export function sortTiles<T extends Tile>(tiles: readonly T[]): T[] {
  return [...tiles].sort((a, b) => tileSortKey(a) - tileSortKey(b));
}

export function countPhysicalTiles(tiles: readonly Tile[]): Map<BaseTileCode, number> {
  const counts = new Map<BaseTileCode, number>();
  for (const tile of tiles) {
    const base = baseTileCode(tile);
    counts.set(base, (counts.get(base) ?? 0) + 1);
  }
  return counts;
}

export function countRedDora(tiles: readonly Tile[]): number {
  return tiles.filter((tile) => AKA_DORAS.has(tile)).length;
}

export function parseTileCodes(codes: readonly TileCode[]): Tile[] {
  const usedByBase = new Map<BaseTileCode, Set<number>>();
  return codes.map((code) => allocateTile136(code, usedByBase));
}

export function tilesTo34Array(tiles: Iterable<Tile>): number[] {
  return TilesConverter.to_34_array(tiles);
}

export function tileToDisplay(tile: Tile): string {
  return getTileMeta(tile).shortLabel;
}

export function tileSuit(tile: Tile): TileSuit {
  return getTileMeta(tile).suit;
}

export function tileRank(tile: Tile): TileRank | HonorRank {
  return getTileMeta(tile).rank;
}

export function windToHonorCode(wind: Wind): HonorTileCode {
  const map: Record<Wind, HonorTileCode> = {
    east: 'z1',
    south: 'z2',
    west: 'z3',
    north: 'z4',
  };
  return map[wind];
}
