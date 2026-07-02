import { HandConfig } from "./hand_config";
import type { Yaku } from "./yaku";

export type ScoreValue = number | bigint;

export interface ScoresResult<T extends ScoreValue = number> {
  main: T;
  additional: T;
  main_bonus: T;
  additional_bonus: T;
  kyoutaku_bonus: T;
  total: T;
  yaku_level: string;
}

export class ScoresCalculator {
  calculate_scores(han: number, fu: number, config: HandConfig, is_yakuman = false): ScoresResult<ScoreValue> {
    return ScoresCalculator.calculate_scores(han, fu, config, is_yakuman);
  }

  static calculate_scores(han: number, fu: number, config: HandConfig, is_yakuman = false): ScoresResult<ScoreValue> {
    let yakuLevel = "";

    if (han >= 13 && !is_yakuman) {
      if (config.options.kazoe_limit === HandConfig.KAZOE_LIMITED) {
        han = 13;
        yakuLevel = "kazoe yakuman";
      } else if (config.options.kazoe_limit === HandConfig.KAZOE_SANBAIMAN) {
        han = 12;
        yakuLevel = "kazoe sanbaiman";
      }
    }

    let rounded: number;
    let doubleRounded: number;
    let fourRounded: number;
    let sixRounded: number;

    if (han >= 5) {
      if (han >= 78) {
        yakuLevel = "6x yakuman";
        if (config.options.limit_to_sextuple_yakuman) {
          rounded = 48000;
        } else {
          const extraHan = Math.floor((han - 78) / 13);
          rounded = 48000 + extraHan * 8000;
        }
      } else if (han >= 65) {
        yakuLevel = "5x yakuman";
        rounded = 40000;
      } else if (han >= 52) {
        yakuLevel = "4x yakuman";
        rounded = 32000;
      } else if (han >= 39) {
        yakuLevel = "3x yakuman";
        rounded = 24000;
      } else if (han >= 26) {
        yakuLevel = "2x yakuman";
        rounded = 16000;
      } else if (han >= 13) {
        yakuLevel = "yakuman";
        rounded = 8000;
      } else if (han >= 11) {
        yakuLevel = "sanbaiman";
        rounded = 6000;
      } else if (han >= 8) {
        yakuLevel = "baiman";
        rounded = 4000;
      } else if (han >= 6) {
        yakuLevel = "haneman";
        rounded = 3000;
      } else {
        yakuLevel = "mangan";
        rounded = 2000;
      }
      doubleRounded = rounded * 2;
      fourRounded = doubleRounded * 2;
      sixRounded = doubleRounded * 3;
    } else {
      const basePoints = fu * 2 ** (2 + han);
      rounded = Math.floor((basePoints + 99) / 100) * 100;
      doubleRounded = Math.floor((2 * basePoints + 99) / 100) * 100;
      fourRounded = Math.floor((4 * basePoints + 99) / 100) * 100;
      sixRounded = Math.floor((6 * basePoints + 99) / 100) * 100;

      let isKiriage = false;
      if (config.options.kiriage) {
        if ((han === 4 && fu === 30) || (han === 3 && fu === 60)) {
          yakuLevel = "kiriage mangan";
          isKiriage = true;
        }
      } else if (rounded > 2000) {
        yakuLevel = "mangan";
      }

      if (rounded > 2000 || isKiriage) {
        rounded = 2000;
        doubleRounded = rounded * 2;
        fourRounded = doubleRounded * 2;
        sixRounded = doubleRounded * 3;
      }
    }

    let main: number;
    let additional: number;
    let mainBonus: number;
    let additionalBonus: number;
    if (config.is_tsumo) {
      main = doubleRounded;
      mainBonus = 100 * config.tsumi_number;
      additionalBonus = mainBonus;
      additional = config.is_dealer ? main : rounded;
    } else {
      additional = 0;
      additionalBonus = 0;
      mainBonus = (config.options.is_three_player ? 200 : 300) * config.tsumi_number;
      main = config.is_dealer ? sixRounded : fourRounded;
    }

    const numAdditional = config.options.is_three_player ? 1 : 2;
    const kyoutakuBonus = 1000 * config.kyoutaku_number;
    const total = main + mainBonus + numAdditional * (additional + additionalBonus) + kyoutakuBonus;

    if (config.is_nagashi_mangan) {
      yakuLevel = "nagashi mangan";
    }

    return {
      main,
      additional,
      main_bonus: mainBonus,
      additional_bonus: additionalBonus,
      kyoutaku_bonus: kyoutakuBonus,
      total,
      yaku_level: yakuLevel
    };
  }
}

const ceilHundred = (value: bigint): bigint => ((value + 99n) / 100n) * 100n;

export class Aotenjou extends ScoresCalculator {
  override calculate_scores(han: number, fu: number, config: HandConfig, is_yakuman = false): ScoresResult<bigint> {
    return Aotenjou.calculate_scores(han, fu, config, is_yakuman);
  }

  static override calculate_scores(han: number, fu: number, config: HandConfig, _is_yakuman = false): ScoresResult<bigint> {
    const basePoints = BigInt(fu) * 2n ** BigInt(2 + han);
    const rounded = ceilHundred(basePoints);
    const doubleRounded = ceilHundred(2n * basePoints);
    const fourRounded = ceilHundred(4n * basePoints);
    const sixRounded = ceilHundred(6n * basePoints);

    let main: bigint;
    let additional: bigint;
    if (config.is_tsumo) {
      main = doubleRounded;
      additional = config.is_dealer ? doubleRounded : rounded;
    } else {
      main = config.is_dealer ? sixRounded : fourRounded;
      additional = 0n;
    }

    return {
      main,
      additional,
      main_bonus: 0n,
      additional_bonus: 0n,
      kyoutaku_bonus: 0n,
      total: main + 2n * additional,
      yaku_level: ""
    };
  }

  aotenjou_filter_yaku(hand_yaku: Yaku[], config: HandConfig): void {
    return Aotenjou.aotenjou_filter_yaku(hand_yaku, config);
  }

  static aotenjou_filter_yaku(hand_yaku: Yaku[], config: HandConfig): void {
    const remove = (yaku: Yaku): void => {
      const index = hand_yaku.indexOf(yaku);
      if (index >= 0) hand_yaku.splice(index, 1);
    };

    if (hand_yaku.includes(config.yaku.daisangen)) {
      remove(config.yaku.chun);
      remove(config.yaku.hatsu);
      remove(config.yaku.haku);
      remove(config.yaku.shosangen);
    }
    if (hand_yaku.includes(config.yaku.tsuisou)) {
      remove(config.yaku.toitoi);
      remove(config.yaku.honroto);
    }
    if (hand_yaku.includes(config.yaku.daisuushi)) {
      remove(config.yaku.toitoi);
    }
    if ((hand_yaku.includes(config.yaku.suuankou) || hand_yaku.includes(config.yaku.suuankou_tanki)) && hand_yaku.includes(config.yaku.toitoi)) {
      remove(config.yaku.toitoi);
    }
    if (hand_yaku.includes(config.yaku.chinroto)) {
      remove(config.yaku.toitoi);
      remove(config.yaku.honroto);
    }
    if (hand_yaku.includes(config.yaku.suukantsu) && hand_yaku.includes(config.yaku.toitoi)) {
      remove(config.yaku.toitoi);
    }
    if (hand_yaku.includes(config.yaku.chuuren_poutou) || hand_yaku.includes(config.yaku.daburu_chuuren_poutou)) {
      remove(config.yaku.chinitsu);
    }
    if (hand_yaku.includes(config.yaku.daisharin)) {
      remove(config.yaku.chinitsu);
      remove(config.yaku.pinfu);
      remove(config.yaku.tanyao);
      remove(config.yaku.ryanpeiko);
      remove(config.yaku.chiitoitsu);
    }
    if (hand_yaku.includes(config.yaku.ryuisou) && hand_yaku.includes(config.yaku.honitsu)) {
      remove(config.yaku.honitsu);
    }
  }
}
