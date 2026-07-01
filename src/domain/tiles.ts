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

export interface Tile {
  code: TileCode;
  suit: TileSuit;
  rank: TileRank | HonorRank;
  red: boolean;
}

export interface TileMeta {
  code: TileCode;
  baseCode: BaseTileCode;
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
    rank: HonorRank;
    label: string;
    shortLabel: string;
    assetFilename: string;
    wind?: Wind;
  }
> = {
  z1: { rank: 1, label: '东', shortLabel: '东', assetFilename: 'Ton.png', wind: 'east' },
  z2: { rank: 2, label: '南', shortLabel: '南', assetFilename: 'Nan.png', wind: 'south' },
  z3: { rank: 3, label: '西', shortLabel: '西', assetFilename: 'Shaa.png', wind: 'west' },
  z4: { rank: 4, label: '北', shortLabel: '北', assetFilename: 'Pei.png', wind: 'north' },
  z5: { rank: 5, label: '白', shortLabel: '白', assetFilename: 'Haku.png' },
  z6: { rank: 6, label: '发', shortLabel: '发', assetFilename: 'Hatsu.png' },
  z7: { rank: 7, label: '中', shortLabel: '中', assetFilename: 'Chun.png' },
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

export function isTileCode(value: string): value is TileCode {
  return (ALL_TILE_CODES as readonly string[]).includes(value);
}

export function isRedFive(code: TileCode): boolean {
  return code === 'm5r' || code === 'p5r' || code === 's5r';
}

export function baseTileCode(code: TileCode): BaseTileCode {
  if (code === 'm5r') return 'm5';
  if (code === 'p5r') return 'p5';
  if (code === 's5r') return 's5';
  return code;
}

export function createTile(code: TileCode): Tile {
  const base = baseTileCode(code);
  const suit = base[0] as TileSuit;
  const rank = Number(base[1]) as TileRank | HonorRank;
  return { code, suit, rank, red: isRedFive(code) };
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
  const code = typeof tileOrCode === 'string' ? tileOrCode : tileOrCode.code;
  const baseCode = baseTileCode(code);
  const suit = baseCode[0] as TileSuit;
  const rank = Number(baseCode[1]) as TileRank | HonorRank;
  const red = isRedFive(code);

  if (suit === 'z') {
    const honor = HONORS[baseCode as HonorTileCode];
    return {
      code,
      baseCode,
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
  const code = typeof tileOrCode === 'string' ? tileOrCode : tileOrCode.code;
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
    const base = baseTileCode(tile.code);
    counts.set(base, (counts.get(base) ?? 0) + 1);
  }
  return counts;
}

export function countRedDora(tiles: readonly Tile[]): number {
  return tiles.filter((tile) => tile.red).length;
}

export function parseTileCodes(codes: readonly TileCode[]): Tile[] {
  return codes.map(createTile);
}

export function tileToDisplay(tile: Tile): string {
  return getTileMeta(tile).shortLabel;
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
