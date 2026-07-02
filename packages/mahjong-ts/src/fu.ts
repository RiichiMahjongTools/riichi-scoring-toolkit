import { TERMINAL_AND_HONOR_INDICES } from "./constants";
import { HandConfig } from "./hand_config";
import { Meld } from "./meld";

export interface FuDetail {
  fu: number;
  reason: string;
}

const IS_TERMINAL_OR_HONOR = Array.from({ length: 34 }, (_, i) => TERMINAL_AND_HONOR_INDICES.has(i));
const OPENED = 1;
const IS_KAN = 2;

export class FuCalculator {
  static BASE = "base";
  static PENCHAN = "penchan";
  static KANCHAN = "kanchan";
  static VALUED_PAIR = "valued_pair";
  static DOUBLE_VALUED_PAIR = "double_valued_pair";
  static PAIR_WAIT = "pair_wait";
  static TSUMO = "tsumo";
  static HAND_WITHOUT_FU = "hand_without_fu";
  static CLOSED_PON = "closed_pon";
  static OPEN_PON = "open_pon";
  static CLOSED_TERMINAL_PON = "closed_terminal_pon";
  static OPEN_TERMINAL_PON = "open_terminal_pon";
  static CLOSED_KAN = "closed_kan";
  static OPEN_KAN = "open_kan";
  static CLOSED_TERMINAL_KAN = "closed_terminal_kan";
  static OPEN_TERMINAL_KAN = "open_terminal_kan";

  static calculate_fu(
    hand: number[][],
    win_tile: number,
    win_group: number[],
    config: HandConfig,
    valued_tiles: Array<number | null> | null = null,
    melds: Meld[] | null = null
  ): [FuDetail[], number] {
    if (hand.length === 7) {
      return [[{ fu: 25, reason: FuCalculator.BASE }], 25];
    }

    const winTile34 = win_tile >> 2;
    valued_tiles = valued_tiles ?? [];
    melds = melds ?? [];
    const fuDetails: FuDetail[] = [];
    let fuTotal = 0;
    const isTsumo = config.is_tsumo;
    const opts = config.options;
    const winGroupLen = win_group.length;

    let winGroupIsChi = false;
    let wg0 = -1;
    let wg1 = -1;
    let wg2 = -1;
    if (winGroupLen === 3) {
      wg0 = win_group[0];
      wg1 = win_group[1];
      wg2 = win_group[2];
      winGroupIsChi = wg0 !== wg1;
    }

    let pairTile = -1;
    const ponSets: number[][] = [];
    let winGroupChiCountInHand = 0;
    for (const grp of hand) {
      const grpLen = grp.length;
      if (grpLen === 2) {
        pairTile = grp[0];
        continue;
      }
      if (grp[0] === grp[1]) {
        ponSets.push(grp);
        continue;
      }
      if (winGroupIsChi && grpLen === 3 && grp[0] === wg0 && grp[1] === wg1 && grp[2] === wg2) {
        winGroupChiCountInHand += 1;
      }
    }

    let isOpenHand = false;
    let winGroupOpenChiCount = 0;
    const meldState = Array(34).fill(0);
    for (const m of melds) {
      if (m.opened) isOpenHand = true;
      const tiles = m.tiles;
      if (m.type === Meld.CHI) {
        if (winGroupIsChi) {
          const [t0, t1, t2] = tiles.map((x) => x >> 2);
          if (t0 === wg0 && t1 === wg1 && t2 === wg2) winGroupOpenChiCount += 1;
        }
      } else if (tiles.length > 0) {
        const tile = tiles[0] >> 2;
        let state = 0;
        if (m.opened) state |= OPENED;
        if (m.type === Meld.KAN || m.type === Meld.SHOUMINKAN) state |= IS_KAN;
        meldState[tile] = state;
      }
    }

    const winGroupIsClosedChi = winGroupIsChi && winGroupChiCountInHand > winGroupOpenChiCount;
    if (winGroupIsClosedChi) {
      const startRank = wg0 % 9;
      const isPenchan = (startRank === 0 && winTile34 === wg2) || (startRank === 6 && winTile34 === wg0);
      if (isPenchan) {
        fuDetails.push({ fu: 2, reason: FuCalculator.PENCHAN });
        fuTotal += 2;
      }
      if (winTile34 === wg1) {
        fuDetails.push({ fu: 2, reason: FuCalculator.KANCHAN });
        fuTotal += 2;
      }
    }

    if (pairTile >= 0 && valued_tiles.length > 0) {
      const valuedCount = valued_tiles.filter((x) => x === pairTile).length;
      if (valuedCount === 1) {
        fuDetails.push({ fu: 2, reason: FuCalculator.VALUED_PAIR });
        fuTotal += 2;
      } else if (valuedCount >= 2) {
        const fu = opts.double_wind_pair_fu;
        fuDetails.push({ fu, reason: FuCalculator.DOUBLE_VALUED_PAIR });
        fuTotal += fu;
      }
    }

    if (winGroupLen === 2) {
      fuDetails.push({ fu: 2, reason: FuCalculator.PAIR_WAIT });
      fuTotal += 2;
    }

    for (const setItem of ponSets) {
      const tile = setItem[0];
      const state = meldState[tile];
      let setWasOpen = (state & OPENED) !== 0;
      const isKanSet = setItem.length === 4 || (state & IS_KAN) !== 0;

      if (!isTsumo && winGroupLen === setItem.length && win_group[0] === tile && win_group[1] === tile) {
        setWasOpen = true;
      }

      const terminal = IS_TERMINAL_OR_HONOR[tile];
      let fu: number;
      let reason: string;
      if (!terminal && !isKanSet && !setWasOpen) [fu, reason] = [4, FuCalculator.CLOSED_PON];
      else if (!terminal && !isKanSet && setWasOpen) [fu, reason] = [2, FuCalculator.OPEN_PON];
      else if (!terminal && isKanSet && !setWasOpen) [fu, reason] = [16, FuCalculator.CLOSED_KAN];
      else if (!terminal && isKanSet && setWasOpen) [fu, reason] = [8, FuCalculator.OPEN_KAN];
      else if (terminal && !isKanSet && !setWasOpen) [fu, reason] = [8, FuCalculator.CLOSED_TERMINAL_PON];
      else if (terminal && !isKanSet && setWasOpen) [fu, reason] = [4, FuCalculator.OPEN_TERMINAL_PON];
      else if (terminal && isKanSet && !setWasOpen) [fu, reason] = [32, FuCalculator.CLOSED_TERMINAL_KAN];
      else [fu, reason] = [16, FuCalculator.OPEN_TERMINAL_KAN];
      fuDetails.push({ fu, reason });
      fuTotal += fu;
    }

    if (isTsumo && (fuTotal > 0 || opts.fu_for_pinfu_tsumo)) {
      fuDetails.push({ fu: 2, reason: FuCalculator.TSUMO });
      fuTotal += 2;
    }

    if (isOpenHand && fuTotal === 0 && opts.fu_for_open_pinfu) {
      fuDetails.push({ fu: 2, reason: FuCalculator.HAND_WITHOUT_FU });
      fuTotal += 2;
    }

    const baseFu = isOpenHand || isTsumo ? 20 : 30;
    fuDetails.push({ fu: baseFu, reason: FuCalculator.BASE });
    fuTotal += baseFu;

    return [fuDetails, Math.floor((fuTotal + 9) / 10) * 10];
  }
}
