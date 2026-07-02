import {
  CHUN,
  DRAGONS,
  EAST,
  HAKU,
  HATSU,
  HONOR_INDICES,
  NORTH,
  SOUTH,
  TERMINAL_AND_HONOR_INDICES,
  TERMINAL_INDICES,
  WEST,
  WINDS
} from "./constants";
import { Meld } from "./meld";
import {
  classify_hand_suits,
  has_pon_or_kan_of,
  is_chi,
  is_pair,
  is_pin,
  is_pon_or_kan,
  is_sou,
  simplify
} from "./utils";

export type Hand = number[][];

type YakuCtor = typeof Yaku & {
  yaku_id?: number;
  yakuName?: string;
  han_open?: number;
  han_closed?: number;
  is_yakuman?: boolean;
};

const flatten = (hand: Iterable<Iterable<number>>): number[] => [...hand].flatMap((item) => [...item]);
const tupleKey = (item: ArrayLike<number>): string => Array.from({ length: item.length }, (_, i) => item[i]).join(",");

export class Yaku {
  static yaku_id = -1;
  static yakuName = "";
  static han_open = 0;
  static han_closed = 0;
  static is_yakuman = false;

  yaku_id: number;
  name: string;
  han_open: number;
  han_closed: number;
  is_yakuman: boolean;

  constructor() {
    if (new.target === Yaku) {
      throw new TypeError("Can't instantiate abstract class Yaku with abstract method is_condition_met");
    }
    if (new.target.prototype.is_condition_met === Yaku.prototype.is_condition_met) {
      throw new TypeError("Can't instantiate abstract class without is_condition_met");
    }
    const ctor = new.target as YakuCtor;
    this.yaku_id = ctor.yaku_id ?? -1;
    this.name = ctor.yakuName ?? "";
    this.han_open = ctor.han_open ?? 0;
    this.han_closed = ctor.han_closed ?? 0;
    this.is_yakuman = ctor.is_yakuman ?? false;
  }

  is_condition_met(_hand: Hand | null, ..._args: unknown[]): boolean {
    throw new TypeError("Abstract method is_condition_met must be implemented");
  }

  toString(): string {
    return this.name;
  }
}

class AlwaysYaku extends Yaku {
  is_condition_met(_hand: Hand | null, ..._args: unknown[]): boolean {
    return true;
  }
}

export class Tsumo extends AlwaysYaku {
  static override yaku_id = 0;
  static override yakuName = "Menzen Tsumo";
  static override han_closed = 1;
}

export class Riichi extends AlwaysYaku {
  static override yaku_id = 1;
  static override yakuName = "Riichi";
  static override han_closed = 1;
}

export class OpenRiichi extends AlwaysYaku {
  static override yaku_id = 2;
  static override yakuName = "Open Riichi";
  static override han_closed = 2;
}

export class Ippatsu extends AlwaysYaku {
  static override yaku_id = 3;
  static override yakuName = "Ippatsu";
  static override han_closed = 1;
}

export class Chankan extends AlwaysYaku {
  static override yaku_id = 4;
  static override yakuName = "Chankan";
  static override han_open = 1;
  static override han_closed = 1;
}

export class Rinshan extends AlwaysYaku {
  static override yaku_id = 5;
  static override yakuName = "Rinshan Kaihou";
  static override han_open = 1;
  static override han_closed = 1;
}

export class Haitei extends AlwaysYaku {
  static override yaku_id = 6;
  static override yakuName = "Haitei Raoyue";
  static override han_open = 1;
  static override han_closed = 1;
}

export class Houtei extends AlwaysYaku {
  static override yaku_id = 7;
  static override yakuName = "Houtei Raoyui";
  static override han_open = 1;
  static override han_closed = 1;
}

export class DaburuRiichi extends AlwaysYaku {
  static override yaku_id = 8;
  static override yakuName = "Double Riichi";
  static override han_closed = 2;
}

export class DaburuOpenRiichi extends AlwaysYaku {
  static override yaku_id = 9;
  static override yakuName = "Double Open Riichi";
  static override han_closed = 3;
}

export class NagashiMangan extends AlwaysYaku {
  static override yaku_id = 10;
  static override yakuName = "Nagashi Mangan";
  static override han_open = 5;
  static override han_closed = 5;
}

export class Renhou extends AlwaysYaku {
  static override yaku_id = 11;
  static override yakuName = "Renhou";
  static override han_closed = 5;
}

export class Pinfu extends AlwaysYaku {
  static override yaku_id = 12;
  static override yakuName = "Pinfu";
  static override han_closed = 1;
}

export class Tanyao extends Yaku {
  static override yaku_id = 13;
  static override yakuName = "Tanyao";
  static override han_open = 1;
  static override han_closed = 1;

  is_condition_met(hand: Hand): boolean {
    return !flatten(hand).some((x) => TERMINAL_AND_HONOR_INDICES.has(x));
  }
}

export class Iipeiko extends Yaku {
  static override yaku_id = 14;
  static override yakuName = "Iipeiko";
  static override han_closed = 1;

  is_condition_met(hand: Hand): boolean {
    const chiCounts = new Map<number, number>();
    for (const item of hand) {
      if (is_chi(item)) {
        chiCounts.set(item[0], (chiCounts.get(item[0]) ?? 0) + 1);
      }
    }
    return [...chiCounts.values()].some((count) => count >= 2);
  }
}

export class Haku extends Yaku {
  static override yaku_id = 15;
  static override yakuName = "Yakuhai (haku)";
  static override han_open = 1;
  static override han_closed = 1;

  is_condition_met(hand: Hand): boolean {
    return has_pon_or_kan_of(hand, HAKU);
  }
}

export class Hatsu extends Yaku {
  static override yaku_id = 16;
  static override yakuName = "Yakuhai (hatsu)";
  static override han_open = 1;
  static override han_closed = 1;

  is_condition_met(hand: Hand): boolean {
    return has_pon_or_kan_of(hand, HATSU);
  }
}

export class Chun extends Yaku {
  static override yaku_id = 17;
  static override yakuName = "Yakuhai (chun)";
  static override han_open = 1;
  static override han_closed = 1;

  is_condition_met(hand: Hand): boolean {
    return has_pon_or_kan_of(hand, CHUN);
  }
}

class SeatWind extends Yaku {
  constructor(private readonly wind: number) {
    super();
  }

  is_condition_met(hand: Hand, player_wind: number | null | undefined): boolean {
    return player_wind === this.wind && has_pon_or_kan_of(hand, this.wind);
  }
}

export class SeatWindEast extends SeatWind {
  static override yaku_id = 18;
  static override yakuName = "Yakuhai (seat wind east)";
  static override han_open = 1;
  static override han_closed = 1;
  constructor() { super(EAST); }
}

export class SeatWindSouth extends SeatWind {
  static override yaku_id = 19;
  static override yakuName = "Yakuhai (seat wind south)";
  static override han_open = 1;
  static override han_closed = 1;
  constructor() { super(SOUTH); }
}

export class SeatWindWest extends SeatWind {
  static override yaku_id = 20;
  static override yakuName = "Yakuhai (seat wind west)";
  static override han_open = 1;
  static override han_closed = 1;
  constructor() { super(WEST); }
}

export class SeatWindNorth extends SeatWind {
  static override yaku_id = 21;
  static override yakuName = "Yakuhai (seat wind north)";
  static override han_open = 1;
  static override han_closed = 1;
  constructor() { super(NORTH); }
}

class RoundWind extends Yaku {
  constructor(private readonly wind: number) {
    super();
  }

  is_condition_met(hand: Hand, round_wind: number | null | undefined): boolean {
    return round_wind === this.wind && has_pon_or_kan_of(hand, this.wind);
  }
}

export class RoundWindEast extends RoundWind {
  static override yaku_id = 22;
  static override yakuName = "Yakuhai (round wind east)";
  static override han_open = 1;
  static override han_closed = 1;
  constructor() { super(EAST); }
}

export class RoundWindSouth extends RoundWind {
  static override yaku_id = 23;
  static override yakuName = "Yakuhai (round wind south)";
  static override han_open = 1;
  static override han_closed = 1;
  constructor() { super(SOUTH); }
}

export class RoundWindWest extends RoundWind {
  static override yaku_id = 24;
  static override yakuName = "Yakuhai (round wind west)";
  static override han_open = 1;
  static override han_closed = 1;
  constructor() { super(WEST); }
}

export class RoundWindNorth extends RoundWind {
  static override yaku_id = 25;
  static override yakuName = "Yakuhai (round wind north)";
  static override han_open = 1;
  static override han_closed = 1;
  constructor() { super(NORTH); }
}

export class Sanshoku extends Yaku {
  static override yaku_id = 26;
  static override yakuName = "Sanshoku Doujun";
  static override han_open = 1;
  static override han_closed = 2;

  is_condition_met(hand: Hand): boolean {
    let souMask = 0;
    let pinMask = 0;
    let manMask = 0;
    for (const item of hand) {
      const first = item[0];
      if (first + 1 !== item[1]) continue;
      const bit = 1 << (first % 9);
      if (first >= 18) souMask |= bit;
      else if (first >= 9) pinMask |= bit;
      else manMask |= bit;
    }
    return (souMask & pinMask & manMask) !== 0;
  }
}

export class Ittsu extends Yaku {
  static override yaku_id = 27;
  static override yakuName = "Ittsu";
  static override han_open = 1;
  static override han_closed = 2;

  is_condition_met(hand: Hand): boolean {
    let souMask = 0;
    let pinMask = 0;
    let manMask = 0;
    for (const item of hand) {
      const first = item[0];
      if (first + 1 !== item[1]) continue;
      let bit = 0;
      const simplified = first % 9;
      if (simplified === 0) bit = 1;
      else if (simplified === 3) bit = 2;
      else if (simplified === 6) bit = 4;
      else continue;

      if (first >= 18) souMask |= bit;
      else if (first >= 9) pinMask |= bit;
      else manMask |= bit;
    }
    return souMask === 7 || pinMask === 7 || manMask === 7;
  }
}

export class Chantai extends Yaku {
  static override yaku_id = 28;
  static override yakuName = "Chantai";
  static override han_open = 1;
  static override han_closed = 2;

  is_condition_met(hand: Hand): boolean {
    let honorSets = 0;
    let terminalSets = 0;
    let countOfChi = 0;
    for (const item of hand) {
      if (is_chi(item)) countOfChi += 1;
      if (TERMINAL_INDICES.has(item[0]) || TERMINAL_INDICES.has(item[item.length - 1])) {
        terminalSets += 1;
      } else if (HONOR_INDICES.has(item[0])) {
        honorSets += 1;
      }
    }
    if (countOfChi === 0) return false;
    return terminalSets + honorSets === 5 && terminalSets !== 0 && honorSets !== 0;
  }
}

export class Honroto extends Yaku {
  static override yaku_id = 29;
  static override yakuName = "Honroutou";
  static override han_open = 2;
  static override han_closed = 2;

  is_condition_met(hand: Hand): boolean {
    return flatten(hand).every((x) => TERMINAL_AND_HONOR_INDICES.has(x));
  }
}

export class Toitoi extends Yaku {
  static override yaku_id = 30;
  static override yakuName = "Toitoi";
  static override han_open = 2;
  static override han_closed = 2;

  is_condition_met(hand: Hand): boolean {
    return hand.filter((item) => is_pon_or_kan(item)).length === 4;
  }
}

export class Sanankou extends Yaku {
  static override yaku_id = 31;
  static override yakuName = "San Ankou";
  static override han_open = 2;
  static override han_closed = 2;

  is_condition_met(hand: Hand, win_tile: number, melds: Meld[], is_tsumo: boolean): boolean {
    const winTile34 = Math.floor(win_tile / 4);
    const openSets = new Set(melds.filter((m) => m.opened).map((m) => tupleKey(m.tiles_34)));
    let hasChiWithWinTile = false;
    let closedPonCount = 0;

    for (const item of hand) {
      const itemKey = tupleKey(item);
      if (is_pon_or_kan(item)) {
        if (!openSets.has(itemKey)) closedPonCount += 1;
      } else if (is_chi(item) && item.includes(winTile34) && !openSets.has(itemKey)) {
        hasChiWithWinTile = true;
      }
    }

    if (!is_tsumo && !hasChiWithWinTile) {
      for (const item of hand) {
        if (is_pon_or_kan(item) && item[0] === winTile34 && !openSets.has(tupleKey(item))) {
          closedPonCount -= 1;
          break;
        }
      }
    }
    return closedPonCount === 3;
  }
}

export class SanKantsu extends Yaku {
  static override yaku_id = 32;
  static override yakuName = "San Kantsu";
  static override han_open = 2;
  static override han_closed = 2;

  is_condition_met(_hand: Hand, melds: Meld[]): boolean {
    return melds.filter((x) => x.type === Meld.KAN || x.type === Meld.SHOUMINKAN).length === 3;
  }
}

export class SanshokuDoukou extends Yaku {
  static override yaku_id = 33;
  static override yakuName = "Sanshoku Doukou";
  static override han_open = 2;
  static override han_closed = 2;

  is_condition_met(hand: Hand): boolean {
    let souMask = 0;
    let pinMask = 0;
    let manMask = 0;
    for (const item of hand) {
      const first = item[0];
      if (first >= 27 || !is_pon_or_kan(item)) continue;
      const bit = 1 << (first % 9);
      if (first >= 18) souMask |= bit;
      else if (first >= 9) pinMask |= bit;
      else manMask |= bit;
    }
    return (souMask & pinMask & manMask) !== 0;
  }
}

export class Chiitoitsu extends Yaku {
  static override yaku_id = 34;
  static override yakuName = "Chiitoitsu";
  static override han_closed = 2;

  is_condition_met(hand: Hand): boolean {
    return hand.length === 7;
  }
}

export class Shosangen extends Yaku {
  static override yaku_id = 35;
  static override yakuName = "Shou Sangen";
  static override han_open = 2;
  static override han_closed = 2;

  is_condition_met(hand: Hand): boolean {
    let count = 0;
    for (const item of hand) {
      if (DRAGONS.has(item[0]) && (is_pair(item) || is_pon_or_kan(item))) count += 1;
    }
    return count === 3;
  }
}

export class Honitsu extends Yaku {
  static override yaku_id = 36;
  static override yakuName = "Honitsu";
  static override han_open = 2;
  static override han_closed = 3;

  is_condition_met(hand: Hand): boolean {
    const [suitMask, honorCount] = classify_hand_suits(hand);
    return [1, 2, 4].includes(suitMask) && honorCount > 0;
  }
}

export class Junchan extends Yaku {
  static override yaku_id = 37;
  static override yakuName = "Junchan";
  static override han_open = 2;
  static override han_closed = 3;

  is_condition_met(hand: Hand): boolean {
    let terminalSets = 0;
    let countOfChi = 0;
    for (const item of hand) {
      if (is_chi(item)) countOfChi += 1;
      if (TERMINAL_INDICES.has(item[0]) || TERMINAL_INDICES.has(item[item.length - 1])) terminalSets += 1;
    }
    return countOfChi !== 0 && terminalSets === 5;
  }
}

export class Ryanpeikou extends Yaku {
  static override yaku_id = 38;
  static override yakuName = "Ryanpeikou";
  static override han_closed = 3;

  is_condition_met(hand: Hand): boolean {
    const chiCounts = new Map<number, number>();
    for (const item of hand) {
      if (is_chi(item)) chiCounts.set(item[0], (chiCounts.get(item[0]) ?? 0) + 1);
    }
    let totalPairs = 0;
    for (const count of chiCounts.values()) totalPairs += Math.floor(count / 2);
    return totalPairs >= 2;
  }
}

export class Chinitsu extends Yaku {
  static override yaku_id = 39;
  static override yakuName = "Chinitsu";
  static override han_open = 5;
  static override han_closed = 6;

  is_condition_met(hand: Hand): boolean {
    const [suitMask, honorCount] = classify_hand_suits(hand);
    return honorCount === 0 && [1, 2, 4].includes(suitMask);
  }
}

export class KokushiMusou extends Yaku {
  static override yaku_id = 100;
  static override yakuName = "Kokushi Musou";
  static override han_closed = 13;
  static override is_yakuman = true;

  is_condition_met(_hand: Hand | null, tiles_34: ArrayLike<number>): boolean {
    return (
      (tiles_34[0] ?? 0) *
        (tiles_34[8] ?? 0) *
        (tiles_34[9] ?? 0) *
        (tiles_34[17] ?? 0) *
        (tiles_34[18] ?? 0) *
        (tiles_34[26] ?? 0) *
        (tiles_34[27] ?? 0) *
        (tiles_34[28] ?? 0) *
        (tiles_34[29] ?? 0) *
        (tiles_34[30] ?? 0) *
        (tiles_34[31] ?? 0) *
        (tiles_34[32] ?? 0) *
        (tiles_34[33] ?? 0) ===
      2
    );
  }
}

export class ChuurenPoutou extends Yaku {
  static override yaku_id = 101;
  static override yakuName = "Chuuren Poutou";
  static override han_closed = 13;
  static override is_yakuman = true;

  is_condition_met(hand: Hand): boolean {
    const [suitMask, honorCount] = classify_hand_suits(hand);
    if (honorCount > 0 || ![1, 2, 4].includes(suitMask)) return false;
    const counts = Array(9).fill(0);
    for (const x of flatten(hand)) counts[simplify(x)] += 1;
    if (counts[0] < 3 || counts[8] < 3) return false;
    let hasTwoTiles = false;
    counts[0] -= 2;
    counts[8] -= 2;
    for (const c of counts) {
      if (c === 1) continue;
      if (c === 2) {
        if (hasTwoTiles) return false;
        hasTwoTiles = true;
      } else {
        return false;
      }
    }
    return hasTwoTiles;
  }
}

export class Suuankou extends Yaku {
  static override yaku_id = 102;
  static override yakuName = "Suu Ankou";
  static override han_closed = 13;
  static override is_yakuman = true;

  is_condition_met(hand: Hand, win_tile: number, is_tsumo: boolean): boolean {
    const winTile34 = Math.floor(win_tile / 4);
    const closedHand = hand.filter((item) => !(!is_tsumo && item.includes(winTile34) && is_pon_or_kan(item)));
    return closedHand.filter((i) => is_pon_or_kan(i)).length === 4;
  }
}

export class Daisangen extends Yaku {
  static override yaku_id = 103;
  static override yakuName = "Daisangen";
  static override han_open = 13;
  static override han_closed = 13;
  static override is_yakuman = true;

  is_condition_met(hand: Hand): boolean {
    return hand.filter((item) => DRAGONS.has(item[0]) && is_pon_or_kan(item)).length === 3;
  }
}

export class Shousuushii extends Yaku {
  static override yaku_id = 104;
  static override yakuName = "Shousuushii";
  static override han_open = 13;
  static override han_closed = 13;
  static override is_yakuman = true;

  is_condition_met(hand: Hand): boolean {
    let countWindSets = 0;
    let windPair = 0;
    for (const item of hand) {
      if (!WINDS.has(item[0])) continue;
      if (is_pair(item)) windPair += 1;
      else if (is_pon_or_kan(item)) countWindSets += 1;
    }
    return countWindSets === 3 && windPair === 1;
  }
}

const GREEN_INDICES = new Set([19, 20, 21, 23, 25, HATSU]);

export class Ryuuiisou extends Yaku {
  static override yaku_id = 105;
  static override yakuName = "Ryuuiisou";
  static override han_open = 13;
  static override han_closed = 13;
  static override is_yakuman = true;

  is_condition_met(hand: Hand): boolean {
    return flatten(hand).every((tile) => GREEN_INDICES.has(tile));
  }
}

export class Suukantsu extends Yaku {
  static override yaku_id = 106;
  static override yakuName = "Suu Kantsu";
  static override han_open = 13;
  static override han_closed = 13;
  static override is_yakuman = true;

  is_condition_met(_hand: Hand, melds: Meld[]): boolean {
    return melds.filter((x) => x.type === Meld.KAN || x.type === Meld.SHOUMINKAN).length === 4;
  }
}

export class Tsuuiisou extends Yaku {
  static override yaku_id = 107;
  static override yakuName = "Tsuu Iisou";
  static override han_open = 13;
  static override han_closed = 13;
  static override is_yakuman = true;

  is_condition_met(hand: Hand): boolean {
    return flatten(hand).every((x) => HONOR_INDICES.has(x));
  }
}

export class Chinroutou extends Yaku {
  static override yaku_id = 108;
  static override yakuName = "Chinroutou";
  static override han_open = 13;
  static override han_closed = 13;
  static override is_yakuman = true;

  is_condition_met(hand: Hand): boolean {
    return flatten(hand).every((x) => TERMINAL_INDICES.has(x));
  }
}

export class Daisharin extends Yaku {
  static override yaku_id = 109;
  static override yakuName = "Daisharin";
  static override han_closed = 13;
  static override is_yakuman = true;

  set_pin(): void { this.name = "Daisharin"; }
  set_man(): void { this.name = "Daisuurin"; }
  set_sou(): void { this.name = "Daichikurin"; }

  rename(hand: Hand): void {
    if (is_sou(hand[0][0])) this.set_sou();
    else if (is_pin(hand[0][0])) this.set_pin();
    else this.set_man();
  }

  is_condition_met(hand: Hand, allow_other_sets: boolean): boolean {
    const [suitMask, honorCount] = classify_hand_suits(hand);
    if (honorCount > 0 || ![1, 2, 4].includes(suitMask)) return false;
    if (!allow_other_sets && suitMask !== 2) return false;
    const counts = Array(9).fill(0);
    for (const item of hand) {
      for (const tile of item) counts[tile % 9] += 1;
    }
    for (let i = 1; i < 8; i += 1) {
      if (counts[i] !== 2) return false;
    }
    return true;
  }
}

export class Daichisei extends Yaku {
  static override yaku_id = 110;
  static override yakuName = "Daichisei";
  static override han_closed = 13;
  static override is_yakuman = true;

  is_condition_met(hand: Hand): boolean {
    return flatten(hand).every((x) => HONOR_INDICES.has(x)) && hand.length === 7;
  }
}

export class DaiSuushii extends Yaku {
  static override yaku_id = 111;
  static override yakuName = "Dai Suushii";
  static override han_open = 26;
  static override han_closed = 26;
  static override is_yakuman = true;

  is_condition_met(hand: Hand): boolean {
    return hand.filter((item) => WINDS.has(item[0]) && is_pon_or_kan(item)).length === 4;
  }
}

export class DaburuKokushiMusou extends AlwaysYaku {
  static override yaku_id = 112;
  static override yakuName = "Kokushi Musou Juusanmen Matchi";
  static override han_closed = 26;
  static override is_yakuman = true;
}

export class SuuankouTanki extends AlwaysYaku {
  static override yaku_id = 113;
  static override yakuName = "Suu Ankou Tanki";
  static override han_closed = 26;
  static override is_yakuman = true;
}

export class DaburuChuurenPoutou extends AlwaysYaku {
  static override yaku_id = 114;
  static override yakuName = "Daburu Chuuren Poutou";
  static override han_closed = 26;
  static override is_yakuman = true;
}

export class Tenhou extends AlwaysYaku {
  static override yaku_id = 115;
  static override yakuName = "Tenhou";
  static override han_closed = 13;
  static override is_yakuman = true;
}

export class Chiihou extends AlwaysYaku {
  static override yaku_id = 116;
  static override yakuName = "Chiihou";
  static override han_closed = 13;
  static override is_yakuman = true;
}

export class RenhouYakuman extends AlwaysYaku {
  static override yaku_id = 117;
  static override yakuName = "Renhou (yakuman)";
  static override han_closed = 13;
  static override is_yakuman = true;
}

export class Sashikomi extends AlwaysYaku {
  static override yaku_id = 118;
  static override yakuName = "Sashikomi";
  static override han_closed = 13;
  static override is_yakuman = true;
}

export class Paarenchan extends AlwaysYaku {
  static override yaku_id = 119;
  static override yakuName = "Paarenchan";
  static override han_open = 13;
  static override han_closed = 13;
  static override is_yakuman = true;
  count = 0;

  set_paarenchan_count(count: number): void {
    this.han_open = 13 * count;
    this.han_closed = 13 * count;
    this.count = count;
  }

  override toString(): string {
    return `Paarenchan ${this.count}`;
  }
}

export class Dora extends AlwaysYaku {
  static override yaku_id = 120;
  static override yakuName = "Dora";
  static override han_open = 1;
  static override han_closed = 1;

  override toString(): string {
    return `Dora ${this.han_closed}`;
  }
}

export class AkaDora extends AlwaysYaku {
  static override yaku_id = 121;
  static override yakuName = "Aka Dora";
  static override han_open = 1;
  static override han_closed = 1;

  override toString(): string {
    return `Aka Dora ${this.han_closed}`;
  }
}

export class UraDora extends AlwaysYaku {
  static override yaku_id = 122;
  static override yakuName = "Ura Dora";
  static override han_closed = 1;

  override toString(): string {
    return `Ura Dora ${this.han_closed}`;
  }
}

export const YAKU_ID_TO_TENHOU_ID: Record<number, number> = {
  [Tsumo.yaku_id]: 0,
  [Riichi.yaku_id]: 1,
  [Ippatsu.yaku_id]: 2,
  [Chankan.yaku_id]: 3,
  [Rinshan.yaku_id]: 4,
  [Haitei.yaku_id]: 5,
  [Houtei.yaku_id]: 6,
  [Pinfu.yaku_id]: 7,
  [Tanyao.yaku_id]: 8,
  [Iipeiko.yaku_id]: 9,
  [SeatWindEast.yaku_id]: 10,
  [SeatWindSouth.yaku_id]: 11,
  [SeatWindWest.yaku_id]: 12,
  [SeatWindNorth.yaku_id]: 13,
  [RoundWindEast.yaku_id]: 14,
  [RoundWindSouth.yaku_id]: 15,
  [RoundWindWest.yaku_id]: 16,
  [RoundWindNorth.yaku_id]: 17,
  [Haku.yaku_id]: 18,
  [Hatsu.yaku_id]: 19,
  [Chun.yaku_id]: 20,
  [DaburuRiichi.yaku_id]: 21,
  [Chiitoitsu.yaku_id]: 22,
  [Chantai.yaku_id]: 23,
  [Ittsu.yaku_id]: 24,
  [Sanshoku.yaku_id]: 25,
  [SanshokuDoukou.yaku_id]: 26,
  [SanKantsu.yaku_id]: 27,
  [Toitoi.yaku_id]: 28,
  [Sanankou.yaku_id]: 29,
  [Shosangen.yaku_id]: 30,
  [Honroto.yaku_id]: 31,
  [Ryanpeikou.yaku_id]: 32,
  [Junchan.yaku_id]: 33,
  [Honitsu.yaku_id]: 34,
  [Chinitsu.yaku_id]: 35,
  [Renhou.yaku_id]: 36,
  [Tenhou.yaku_id]: 37,
  [Chiihou.yaku_id]: 38,
  [Daisangen.yaku_id]: 39,
  [Suuankou.yaku_id]: 40,
  [SuuankouTanki.yaku_id]: 41,
  [Tsuuiisou.yaku_id]: 42,
  [Ryuuiisou.yaku_id]: 43,
  [Chinroutou.yaku_id]: 44,
  [ChuurenPoutou.yaku_id]: 45,
  [DaburuChuurenPoutou.yaku_id]: 46,
  [KokushiMusou.yaku_id]: 47,
  [DaburuKokushiMusou.yaku_id]: 48,
  [DaiSuushii.yaku_id]: 49,
  [Shousuushii.yaku_id]: 50,
  [Suukantsu.yaku_id]: 51,
  [Dora.yaku_id]: 52,
  [UraDora.yaku_id]: 53,
  [AkaDora.yaku_id]: 54
};

export class YakuConfig {
  tsumo = new Tsumo();
  riichi = new Riichi();
  open_riichi = new OpenRiichi();
  ippatsu = new Ippatsu();
  chankan = new Chankan();
  rinshan = new Rinshan();
  haitei = new Haitei();
  houtei = new Houtei();
  daburu_riichi = new DaburuRiichi();
  daburu_open_riichi = new DaburuOpenRiichi();
  nagashi_mangan = new NagashiMangan();
  renhou = new Renhou();

  pinfu = new Pinfu();
  tanyao = new Tanyao();
  iipeiko = new Iipeiko();
  haku = new Haku();
  hatsu = new Hatsu();
  chun = new Chun();

  seat_wind_east = new SeatWindEast();
  seat_wind_south = new SeatWindSouth();
  seat_wind_west = new SeatWindWest();
  seat_wind_north = new SeatWindNorth();
  round_wind_east = new RoundWindEast();
  round_wind_south = new RoundWindSouth();
  round_wind_west = new RoundWindWest();
  round_wind_north = new RoundWindNorth();

  sanshoku = new Sanshoku();
  ittsu = new Ittsu();
  chantai = new Chantai();
  honroto = new Honroto();
  toitoi = new Toitoi();
  sanankou = new Sanankou();
  sankantsu = new SanKantsu();
  sanshoku_douko = new SanshokuDoukou();
  chiitoitsu = new Chiitoitsu();
  shosangen = new Shosangen();

  honitsu = new Honitsu();
  junchan = new Junchan();
  ryanpeiko = new Ryanpeikou();

  chinitsu = new Chinitsu();

  kokushi = new KokushiMusou();
  chuuren_poutou = new ChuurenPoutou();
  suuankou = new Suuankou();
  daisangen = new Daisangen();
  shosuushi = new Shousuushii();
  ryuisou = new Ryuuiisou();
  suukantsu = new Suukantsu();
  tsuisou = new Tsuuiisou();
  chinroto = new Chinroutou();
  daisharin = new Daisharin();
  daichisei = new Daichisei();

  daisuushi = new DaiSuushii();
  daburu_kokushi = new DaburuKokushiMusou();
  suuankou_tanki = new SuuankouTanki();
  daburu_chuuren_poutou = new DaburuChuurenPoutou();

  tenhou = new Tenhou();
  chiihou = new Chiihou();
  renhou_yakuman = new RenhouYakuman();
  sashikomi = new Sashikomi();
  paarenchan = new Paarenchan();

  dora = new Dora();
  aka_dora = new AkaDora();
  ura_dora = new UraDora();
}
