import { Meld } from "./meld";

export const _BlockType = {
  QUAD: 0,
  TRIPLET: 1,
  PAIR: 2,
  SEQUENCE: 3
} as const;

type BlockTypeValue = (typeof _BlockType)[keyof typeof _BlockType];

export const NotImplemented = Symbol("NotImplemented");

export class _Block {
  tile_34: number;
  ty: BlockTypeValue;

  constructor(tile_34: number, ty: BlockTypeValue) {
    this.tile_34 = tile_34;
    this.ty = ty;
  }

  static from_meld(meld: Meld): _Block {
    const tile34 = meld.tiles_34[0];
    if (meld.type === Meld.CHI) {
      return new _Block(tile34, _BlockType.SEQUENCE);
    }
    if (meld.type === Meld.PON) {
      return new _Block(tile34, _BlockType.TRIPLET);
    }
    if (meld.type === Meld.KAN || meld.type === Meld.SHOUMINKAN) {
      return new _Block(tile34, _BlockType.QUAD);
    }
    throw new Error(`invalid meld type: ${meld.type}, tiles: ${meld.tiles_34}`);
  }

  get tiles_34(): number[] {
    if (this.ty === _BlockType.QUAD) return [this.tile_34, this.tile_34, this.tile_34, this.tile_34];
    if (this.ty === _BlockType.TRIPLET) return [this.tile_34, this.tile_34, this.tile_34];
    if (this.ty === _BlockType.PAIR) return [this.tile_34, this.tile_34];
    return [this.tile_34, this.tile_34 + 1, this.tile_34 + 2];
  }

  key(): string {
    return `${this.tile_34}:${this.ty}`;
  }

  __eq__(other: unknown): boolean | typeof NotImplemented {
    if (!(other instanceof _Block)) return NotImplemented;
    return this.tile_34 === other.tile_34 && this.ty === other.ty;
  }

  __lt__(other: unknown): boolean | typeof NotImplemented {
    if (!(other instanceof _Block)) return NotImplemented;
    return this.tile_34 < other.tile_34 || (this.tile_34 === other.tile_34 && this.ty < other.ty);
  }
}

const compareBlocks = (a: _Block, b: _Block): number => a.tile_34 - b.tile_34 || a.ty - b.ty;
const comboKey = (blocks: _Block[]): string => blocks.map((b) => b.key()).join("|");
const compareCombos = (a: _Block[], b: _Block[]): number => {
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const diff = compareBlocks(a[i], b[i]);
    if (diff !== 0) return diff;
  }
  return a.length - b.length;
};

export class HandDivider {
  private static cache = new Map<string, _Block[][]>();

  static divide_hand(tiles_34: ArrayLike<number>, melds: Meld[] | null = null): number[][][] {
    const tiles = Array.from({ length: 34 }, (_, i) => tiles_34[i] ?? 0);
    if (!HandDivider._validate_tiles(tiles)) {
      return [];
    }
    const meldBlocks = HandDivider._melds_to_blocks(melds);
    const pureHand = HandDivider._get_pure_hand(tiles, meldBlocks);
    const combinations = HandDivider._divide_hand_impl(pureHand, meldBlocks);
    return combinations.map((blocks) => blocks.map((b) => b.tiles_34));
  }

  static _validate_tiles(tiles_34: ArrayLike<number>): boolean {
    for (let i = 0; i < tiles_34.length; i += 1) {
      const count = tiles_34[i] ?? 0;
      if (count < 0 || count > 4) return false;
    }
    return true;
  }

  static _melds_to_blocks(melds: Meld[] | null = null): _Block[] {
    if (!melds || melds.length === 0) {
      return [];
    }
    return melds.map((m) => _Block.from_meld(m));
  }

  static _get_pure_hand(tiles_34: number[], melds: _Block[]): number[] {
    const pureHand = [...tiles_34];
    for (const meld of melds) {
      for (const index of meld.tiles_34) {
        pureHand[index] -= 1;
      }
    }
    return pureHand;
  }

  static _divide_hand_impl(pure_hand: number[], melds: _Block[]): _Block[][] {
    const cacheKey = `${pure_hand.join(",")}#${comboKey(melds)}`;
    const cached = HandDivider.cache.get(cacheKey);
    if (cached) {
      return cached.map((combo) => combo.map((b) => new _Block(b.tile_34, b.ty)));
    }

    const hand = [...pure_hand];
    const manCombinations = HandDivider._decompose_single_color_hand(hand.slice(0, 9), 0);
    const pinCombinations = HandDivider._decompose_single_color_hand(hand.slice(9, 18), 9);
    const souCombinations = HandDivider._decompose_single_color_hand(hand.slice(18, 27), 18);
    const honors = HandDivider._decompose_honors_hand(hand.slice(27, 34));
    const combinations: _Block[][] = [];

    if (melds.length === 0) {
      const chiitoitsu = HandDivider._decompose_chiitoitsu(hand);
      if (chiitoitsu.length > 0) {
        combinations.push(chiitoitsu);
      }
    }

    for (const man of manCombinations) {
      for (const pin of pinCombinations) {
        for (const sou of souCombinations) {
          const allBlocks = [...man, ...pin, ...sou, ...honors];
          const numPair = allBlocks.filter((block) => block.ty === _BlockType.PAIR).length;
          if (numPair !== 1) continue;
          allBlocks.push(...melds);
          if (allBlocks.length !== 5) continue;
          allBlocks.sort(compareBlocks);
          combinations.push(allBlocks);
        }
      }
    }

    combinations.sort(compareCombos);
    HandDivider.cache.set(cacheKey, combinations.map((combo) => combo.map((b) => new _Block(b.tile_34, b.ty))));
    return combinations;
  }

  static _decompose_chiitoitsu(pure_hand: number[]): _Block[] {
    if (pure_hand.some((count) => count !== 0 && count !== 2)) {
      return [];
    }
    const blocks: _Block[] = [];
    for (let i = 0; i < pure_hand.length; i += 1) {
      if (pure_hand[i] === 2) {
        blocks.push(new _Block(i, _BlockType.PAIR));
      }
    }
    return blocks.length === 7 ? blocks : [];
  }

  static _decompose_single_color_hand(single_color_hand: number[], suit: 0 | 9 | 18): _Block[][] {
    const remaining = single_color_hand.reduce((a, b) => a + b, 0);
    const combinations = HandDivider._decompose_single_color_hand_without_pair(single_color_hand, [], 0, suit, remaining);

    if (combinations.length === 0) {
      for (let pair = 0; pair < 9; pair += 1) {
        if (single_color_hand[pair] < 2) continue;
        single_color_hand[pair] -= 2;
        const blocks = [new _Block(suit + pair, _BlockType.PAIR)];
        const comb = HandDivider._decompose_single_color_hand_without_pair(single_color_hand, blocks, 0, suit, remaining - 2);
        single_color_hand[pair] += 2;
        if (comb.length === 0) continue;
        combinations.push(...comb);
      }
    }

    return combinations;
  }

  static _decompose_single_color_hand_without_pair(
    single_color_hand: number[],
    blocks: _Block[],
    i: number,
    suit: 0 | 9 | 18,
    remaining: number
  ): _Block[][] {
    if (i === 9) {
      return remaining === 0 ? [blocks] : [];
    }

    if (single_color_hand[i] === 0) {
      return HandDivider._decompose_single_color_hand_without_pair(single_color_hand, blocks, i + 1, suit, remaining);
    }

    const combinations: _Block[][] = [];

    if (i < 7 && single_color_hand[i] >= 1 && single_color_hand[i + 1] >= 1 && single_color_hand[i + 2] >= 1) {
      single_color_hand[i] -= 1;
      single_color_hand[i + 1] -= 1;
      single_color_hand[i + 2] -= 1;
      combinations.push(
        ...HandDivider._decompose_single_color_hand_without_pair(
          single_color_hand,
          [...blocks, new _Block(suit + i, _BlockType.SEQUENCE)],
          i,
          suit,
          remaining - 3
        )
      );
      single_color_hand[i + 2] += 1;
      single_color_hand[i + 1] += 1;
      single_color_hand[i] += 1;
    }

    if (single_color_hand[i] >= 3) {
      single_color_hand[i] -= 3;
      combinations.push(
        ...HandDivider._decompose_single_color_hand_without_pair(
          single_color_hand,
          [...blocks, new _Block(suit + i, _BlockType.TRIPLET)],
          i + 1,
          suit,
          remaining - 3
        )
      );
      single_color_hand[i] += 3;
    }

    return combinations;
  }

  static _decompose_honors_hand(honors_hand: number[]): _Block[] {
    let hasPair = false;
    const blocks: _Block[] = [];
    for (let i = 0; i < honors_hand.length; i += 1) {
      const count = honors_hand[i];
      if (count === 0) continue;
      if (count === 2) {
        if (hasPair) return [];
        blocks.push(new _Block(27 + i, _BlockType.PAIR));
        hasPair = true;
      } else if (count === 3) {
        blocks.push(new _Block(27 + i, _BlockType.TRIPLET));
      } else {
        return [];
      }
    }
    return blocks;
  }
}
