import {
  AKA_DORAS,
  EAST,
  HAKU,
  NORTH,
  TERMINAL_INDICES
} from "./constants";

export interface SuitCount {
  count: number;
  name: "sou" | "man" | "pin" | "honor";
  function: (tile: number) => boolean;
}

export function is_aka_dora(tile_136: number, aka_enabled: boolean): boolean {
  return aka_enabled && AKA_DORAS.has(tile_136);
}

export function plus_dora(tile_136: number, dora_indicators_136: Iterable<number>, add_aka_dora = false): number {
  let tileIndex = Math.floor(tile_136 / 4);
  let doraCount = 0;

  if (add_aka_dora && is_aka_dora(tile_136, true)) {
    doraCount += 1;
  }

  for (const doraIndicator of dora_indicators_136) {
    let dora = Math.floor(doraIndicator / 4);
    if (tileIndex < EAST) {
      if (dora === 8) {
        dora = -1;
      } else if (dora === 17) {
        dora = 8;
      } else if (dora === 26) {
        dora = 17;
      }
      if (tileIndex === dora + 1) {
        doraCount += 1;
      }
    } else {
      if (dora < EAST) {
        continue;
      }
      dora -= 27;
      const tileIndexTemp = tileIndex - 27;
      if (dora === 3) {
        dora = -1;
      }
      if (dora === 6) {
        dora = 3;
      }
      if (tileIndexTemp === dora + 1) {
        doraCount += 1;
      }
    }
  }
  return doraCount;
}

export function _indicator_to_dora_34(indicator_34: number): number {
  if (indicator_34 < EAST) {
    const suitBase = Math.floor(indicator_34 / 9) * 9;
    return suitBase + ((indicator_34 - suitBase + 1) % 9);
  }
  if (indicator_34 <= NORTH) {
    return EAST + ((indicator_34 - EAST + 1) % 4);
  }
  return HAKU + ((indicator_34 - HAKU + 1) % 3);
}

export function build_dora_count_map(dora_indicators_136: Iterable<number>): Map<number, number> {
  const doraMap = new Map<number, number>();
  for (const indicator of dora_indicators_136) {
    const dora34 = _indicator_to_dora_34(Math.floor(indicator / 4));
    doraMap.set(dora34, (doraMap.get(dora34) ?? 0) + 1);
  }
  return doraMap;
}

export function count_dora_for_hand(tiles_34: ArrayLike<number>, dora_count_map: Map<number, number>): number {
  let total = 0;
  for (const [tile34, doraCount] of dora_count_map.entries()) {
    total += (tiles_34[tile34] ?? 0) * doraCount;
  }
  return total;
}

export function is_chi(item: ArrayLike<number>): boolean {
  return item.length === 3 && item[0] + 1 === item[1] && item[1] + 1 === item[2];
}

export function is_pon(item: ArrayLike<number>): boolean {
  return item.length === 3 && item[0] === item[1] && item[1] === item[2];
}

export function is_kan(item: ArrayLike<number>): boolean {
  return item.length === 4;
}

export function is_pon_or_kan(item: ArrayLike<number>): boolean {
  if (item.length === 4) {
    return true;
  }
  return item.length === 3 && item[0] === item[1] && item[1] === item[2];
}

export function is_pair(item: ArrayLike<number>): boolean {
  return item.length === 2;
}

export function has_pon_or_kan_of(hand: Iterable<ArrayLike<number>>, tile: number): boolean {
  for (const item of hand) {
    if (item[0] !== tile) {
      continue;
    }
    if (item.length === 4 || (item.length === 3 && item[1] === tile)) {
      return true;
    }
  }
  return false;
}

export function classify_hand_suits(hand: Iterable<ArrayLike<number>>): [number, number] {
  let suitMask = 0;
  let honorCount = 0;
  for (const item of hand) {
    const first = item[0];
    if (first >= 27) {
      honorCount += 1;
    } else if (first >= 18) {
      suitMask |= 1;
    } else if (first >= 9) {
      suitMask |= 2;
    } else {
      suitMask |= 4;
    }
  }
  return [suitMask, honorCount];
}

export function is_man(tile: number): boolean {
  return tile <= 8;
}

export function is_pin(tile: number): boolean {
  return tile > 8 && tile <= 17;
}

export function is_sou(tile: number): boolean {
  return tile > 17 && tile <= 26;
}

export function is_honor(tile: number): boolean {
  return tile >= 27;
}

export function is_sangenpai(tile_34: number): boolean {
  return tile_34 >= 31;
}

export function is_terminal(tile: number): boolean {
  return TERMINAL_INDICES.has(tile);
}

export function is_dora_indicator_for_terminal(tile: number): boolean {
  return new Set([7, 8, 16, 17, 25, 26]).has(tile);
}

export function contains_terminals(hand_set: Iterable<number>): boolean {
  for (const x of hand_set) {
    if (TERMINAL_INDICES.has(x)) {
      return true;
    }
  }
  return false;
}

export function simplify(tile: number): number {
  return tile % 9;
}

export function find_isolated_tile_indices(hand_34: ArrayLike<number>): number[] {
  const isolatedIndices: number[] = [];
  for (const suitStart of [0, 9, 18]) {
    for (let i = 0; i < 9; i += 1) {
      const x = suitStart + i;
      if ((hand_34[x] ?? 0) !== 0) {
        continue;
      }
      if (i === 0) {
        if ((hand_34[x + 1] ?? 0) === 0) {
          isolatedIndices.push(x);
        }
      } else if (i === 8) {
        if ((hand_34[x - 1] ?? 0) === 0) {
          isolatedIndices.push(x);
        }
      } else if ((hand_34[x - 1] ?? 0) === 0 && (hand_34[x + 1] ?? 0) === 0) {
        isolatedIndices.push(x);
      }
    }
  }
  for (let x = 27; x < 34; x += 1) {
    if ((hand_34[x] ?? 0) === 0) {
      isolatedIndices.push(x);
    }
  }
  return isolatedIndices;
}

export function is_tile_strictly_isolated(hand_34: ArrayLike<number>, tile_34: number): boolean {
  if (is_honor(tile_34)) {
    return (hand_34[tile_34] ?? 0) <= 1;
  }

  const simplified = simplify(tile_34);
  if ((hand_34[tile_34] ?? 0) > 1) {
    return false;
  }
  if (simplified === 0) {
    return (hand_34[tile_34 + 1] ?? 0) === 0 && (hand_34[tile_34 + 2] ?? 0) === 0;
  }
  if (simplified === 1) {
    return (
      (hand_34[tile_34 - 1] ?? 0) === 0 &&
      (hand_34[tile_34 + 1] ?? 0) === 0 &&
      (hand_34[tile_34 + 2] ?? 0) === 0
    );
  }
  if (simplified === 7) {
    return (
      (hand_34[tile_34 - 2] ?? 0) === 0 &&
      (hand_34[tile_34 - 1] ?? 0) === 0 &&
      (hand_34[tile_34 + 1] ?? 0) === 0
    );
  }
  if (simplified === 8) {
    return (hand_34[tile_34 - 2] ?? 0) === 0 && (hand_34[tile_34 - 1] ?? 0) === 0;
  }
  return (
    (hand_34[tile_34 - 2] ?? 0) === 0 &&
    (hand_34[tile_34 - 1] ?? 0) === 0 &&
    (hand_34[tile_34 + 1] ?? 0) === 0 &&
    (hand_34[tile_34 + 2] ?? 0) === 0
  );
}

export function count_tiles_by_suits(tiles_34: ArrayLike<number>): SuitCount[] {
  const suits: SuitCount[] = [
    { count: 0, name: "sou", function: is_sou },
    { count: 0, name: "man", function: is_man },
    { count: 0, name: "pin", function: is_pin },
    { count: 0, name: "honor", function: is_honor }
  ];

  for (let x = 0; x < 34; x += 1) {
    const tile = tiles_34[x] ?? 0;
    if (!tile) {
      continue;
    }
    for (const item of suits) {
      if (item.function(x)) {
        item.count += tile;
      }
    }
  }
  return suits;
}
