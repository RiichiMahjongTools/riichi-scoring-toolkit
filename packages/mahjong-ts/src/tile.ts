import { FIVE_RED_MAN, FIVE_RED_PIN, FIVE_RED_SOU } from "./constants";

export class Tile {
  value: unknown;
  is_tsumogiri: unknown;

  constructor(value: unknown, is_tsumogiri: unknown) {
    this.value = value;
    this.is_tsumogiri = is_tsumogiri;
  }
}

export class TilesConverter {
  static to_one_line_string(tiles: Iterable<number>, print_aka_dora = false): string {
    const sorted = [...tiles].sort((a, b) => a - b);
    const man = sorted.filter((t) => t < 36);
    const pin = sorted.filter((t) => t >= 36 && t < 72).map((t) => t - 36);
    const sou = sorted.filter((t) => t >= 72 && t < 108).map((t) => t - 72);
    const honors = sorted.filter((t) => t >= 108).map((t) => t - 108);

    const words = (suits: number[], redFive: number, suffix: string): string => {
      if (suits.length === 0) {
        return "";
      }
      return (
        suits.map((i) => (i === redFive && print_aka_dora ? "0" : String(Math.floor(i / 4) + 1))).join("") + suffix
      );
    };

    return (
      words(man, FIVE_RED_MAN, "m") +
      words(pin, FIVE_RED_PIN - 36, "p") +
      words(sou, FIVE_RED_SOU - 72, "s") +
      words(honors, -109, "z")
    );
  }

  static to_34_array(tiles: Iterable<number>): number[] {
    const results = Array(34).fill(0);
    for (const tile of tiles) {
      results[Math.floor(tile / 4)] += 1;
    }
    return results;
  }

  static to_136_array(tiles: ArrayLike<number>): number[] {
    const results: number[] = [];
    for (let index = 0; index < tiles.length; index += 1) {
      const count = tiles[index] ?? 0;
      const baseId = index * 4;
      for (let i = 0; i < count; i += 1) {
        results.push(baseId + i);
      }
    }
    return results;
  }

  static _split_string(stringValue: string | null | undefined, offset: number, red: number | null = null): number[] {
    if (!stringValue) {
      return [];
    }

    const counts = new Map<number, number>();
    const result: number[] = [];
    for (const ch of stringValue) {
      if ((ch === "r" || ch === "0") && red !== null) {
        result.push(red);
        continue;
      }

      let tile = offset + (Number.parseInt(ch, 10) - 1) * 4;
      if (red !== null && tile === red) {
        tile += 1;
      }
      const countOfTiles = counts.get(tile) ?? 0;
      result.push(tile + countOfTiles);
      counts.set(tile, countOfTiles + 1);
    }
    return result;
  }

  static string_to_136_array(
    paramsOrSou: {
    sou?: string | null;
    pin?: string | null;
    man?: string | null;
    honors?: string | null;
    has_aka_dora?: boolean;
  } | string | null = {},
    pinArg: string | null = null,
    manArg: string | null = null,
    honorsArg: string | null = null,
    hasAkaDoraArg = false
  ): number[] {
    const params = (typeof paramsOrSou === "object" && paramsOrSou !== null && !Array.isArray(paramsOrSou)
        ? paramsOrSou
        : { sou: paramsOrSou, pin: pinArg, man: manArg, honors: honorsArg, has_aka_dora: hasAkaDoraArg }) as {
      sou?: string | null;
      pin?: string | null;
      man?: string | null;
      honors?: string | null;
      has_aka_dora?: boolean;
    };
    const { sou = null, pin = null, man = null, honors = null, has_aka_dora = false } = params;
    let results = TilesConverter._split_string(man, 0, has_aka_dora ? FIVE_RED_MAN : null);
    results = results.concat(TilesConverter._split_string(pin, 36, has_aka_dora ? FIVE_RED_PIN : null));
    results = results.concat(TilesConverter._split_string(sou, 72, has_aka_dora ? FIVE_RED_SOU : null));
    results = results.concat(TilesConverter._split_string(honors, 108));
    return results;
  }

  static string_to_34_array(
    paramsOrSou: {
    sou?: string | null;
    pin?: string | null;
    man?: string | null;
    honors?: string | null;
  } | string | null = {},
    pinArg: string | null = null,
    manArg: string | null = null,
    honorsArg: string | null = null
  ): number[] {
    const params = (typeof paramsOrSou === "object" && paramsOrSou !== null && !Array.isArray(paramsOrSou)
        ? paramsOrSou
        : { sou: paramsOrSou, pin: pinArg, man: manArg, honors: honorsArg }) as {
      sou?: string | null;
      pin?: string | null;
      man?: string | null;
      honors?: string | null;
    };
    return TilesConverter.to_34_array(TilesConverter.string_to_136_array(params));
  }

  static find_34_tile_in_136_array(tile34: number | null | undefined, tiles: Iterable<number>): number | null {
    if (tile34 === null || tile34 === undefined || tile34 > 33) {
      return null;
    }
    const tileSet = new Set(tiles);
    const tile = tile34 * 4;
    for (let i = 0; i < 4; i += 1) {
      const possibleTile = tile + i;
      if (tileSet.has(possibleTile)) {
        return possibleTile;
      }
    }
    return null;
  }

  static one_line_string_to_136_array(stringValue: string, has_aka_dora = false): number[] {
    let sou = "";
    let pin = "";
    let man = "";
    let honors = "";
    let splitStart = 0;

    for (let index = 0; index < stringValue.length; index += 1) {
      const ch = stringValue[index];
      if (ch === "m") {
        man += stringValue.slice(splitStart, index);
        splitStart = index + 1;
      }
      if (ch === "p") {
        pin += stringValue.slice(splitStart, index);
        splitStart = index + 1;
      }
      if (ch === "s") {
        sou += stringValue.slice(splitStart, index);
        splitStart = index + 1;
      }
      if (ch === "z" || ch === "h") {
        honors += stringValue.slice(splitStart, index);
        splitStart = index + 1;
      }
    }

    return TilesConverter.string_to_136_array({ sou, pin, man, honors, has_aka_dora });
  }

  static one_line_string_to_34_array(stringValue: string, has_aka_dora = false): number[] {
    return TilesConverter.to_34_array(TilesConverter.one_line_string_to_136_array(stringValue, has_aka_dora));
  }
}
