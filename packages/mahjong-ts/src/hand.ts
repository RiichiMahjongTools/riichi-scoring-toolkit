import { AKA_DORAS, CHUN, HAKU, HATSU, NORTH } from "./constants";
import { HandDivider } from "./divider";
import { FuCalculator, type FuDetail } from "./fu";
import { HandConfig } from "./hand_config";
import { HandResponse } from "./hand_response";
import { Meld } from "./meld";
import { Aotenjou, ScoresCalculator, type ScoresResult, type ScoreValue } from "./scores";
import { TilesConverter } from "./tile";
import { build_dora_count_map, classify_hand_suits, count_dora_for_hand, plus_dora } from "./utils";
import type { Hand, Yaku } from "./yaku";

interface CalculatedHand {
  cost: ScoresResult<ScoreValue> | null;
  error: string | null;
  hand_yaku: Yaku[];
  han: number;
  fu: number;
  fu_details: FuDetail[];
}

const ALL_SUITS_MASK = 7;

export class HandCalculator {
  static ERR_NO_WINNING_TILE = "winning_tile_not_in_hand";
  static ERR_HAND_NOT_WINNING = "hand_not_winning";
  static ERR_NO_YAKU = "no_yaku";

  static ERR_OPEN_HAND_RIICHI = "open_hand_riichi_not_allowed";
  static ERR_OPEN_HAND_DABURI = "open_hand_daburi_not_allowed";
  static ERR_IPPATSU_WITHOUT_RIICHI = "ippatsu_without_riichi_not_allowed";

  static ERR_CHANKAN_WITH_TSUMO = "chankan_with_tsumo_not_allowed";
  static ERR_RINSHAN_WITHOUT_TSUMO = "rinshan_without_tsumo_not_allowed";
  static ERR_HAITEI_WITHOUT_TSUMO = "haitei_without_tsumo_not_allowed";
  static ERR_HOUTEI_WITH_TSUMO = "houtei_with_tsumo_not_allowed";
  static ERR_HAITEI_WITH_RINSHAN = "haitei_with_rinshan_not_allowed";
  static ERR_HOUTEI_WITH_CHANKAN = "houtei_with_chankan_not_allowed";

  static ERR_TENHOU_NOT_AS_DEALER = "tenhou_not_as_dealer_not_allowed";
  static ERR_TENHOU_WITHOUT_TSUMO = "tenhou_without_tsumo_not_allowed";
  static ERR_TENHOU_WITH_MELD = "tenhou_with_meld_not_allowed";

  static ERR_CHIIHOU_AS_DEALER = "chiihou_as_dealer_not_allowed";
  static ERR_CHIIHOU_WITHOUT_TSUMO = "chiihou_without_tsumo_not_allowed";
  static ERR_CHIIHOU_WITH_MELD = "chiihou_with_meld_not_allowed";

  static ERR_RENHOU_AS_DEALER = "renhou_as_dealer_not_allowed";
  static ERR_RENHOU_WITH_TSUMO = "renhou_with_tsumo_not_allowed";
  static ERR_RENHOU_WITH_MELD = "renhou_with_meld_not_allowed";

  static ERR_TSUBAME_GAESHI_WITH_TSUMO = "tsubame_gaeshi_with_tsumo_not_allowed";
  static ERR_TSUBAME_GAESHI_WITH_OPEN_HAND = "tsubame_gaeshi_with_open_hand_not_allowed";
  static ERR_KANFURI_WITH_TSUMO = "kanfuri_with_tsumo_not_allowed";

  estimate_hand_value(
    tiles: Iterable<number>,
    win_tile: number,
    melds: Meld[] | null = null,
    dora_indicators: Iterable<number> | null = null,
    config: HandConfig | null = null,
    scores_calculator_factory: new () => ScoresCalculator = ScoresCalculator,
    ura_dora_indicators: Iterable<number> | null = null
  ): HandResponse {
    return HandCalculator.estimate_hand_value(
      tiles,
      win_tile,
      melds,
      dora_indicators,
      config,
      scores_calculator_factory,
      ura_dora_indicators
    );
  }

  static estimate_hand_value(
    tilesInput: Iterable<number>,
    win_tile: number,
    melds: Meld[] | null = null,
    doraIndicatorsInput: Iterable<number> | null = null,
    config: HandConfig | null = null,
    scores_calculator_factory: new () => ScoresCalculator = ScoresCalculator,
    uraDoraIndicatorsInput: Iterable<number> | null = null
  ): HandResponse {
    const tiles = [...tilesInput];
    melds = melds ?? [];
    const dora_indicators = doraIndicatorsInput ? [...doraIndicatorsInput] : [];
    const ura_dora_indicators = uraDoraIndicatorsInput ? [...uraDoraIndicatorsInput] : [];
    config = config ?? new HandConfig();

    const scoresCalculator = new scores_calculator_factory();
    const tiles34 = TilesConverter.to_34_array(tiles);
    const isAotenjou = scoresCalculator instanceof Aotenjou;

    const openedMelds = melds.filter((x) => x.opened).map((x) => x.tiles_34);
    const isOpenHand = openedMelds.length > 0;

    if (config.is_nagashi_mangan) {
      const handYaku = [config.yaku.nagashi_mangan];
      const fu = 30;
      const han = config.yaku.nagashi_mangan.han_closed;
      const cost = scoresCalculator.calculate_scores(han, fu, config, false);
      return new HandResponse({ cost, han, fu, yaku: handYaku });
    }

    if (!tiles.includes(win_tile)) {
      return new HandResponse({ error: HandCalculator.ERR_NO_WINNING_TILE });
    }
    if (config.is_riichi && !config.is_daburu_riichi && isOpenHand) {
      return new HandResponse({ error: HandCalculator.ERR_OPEN_HAND_RIICHI });
    }
    if (config.is_daburu_riichi && isOpenHand) {
      return new HandResponse({ error: HandCalculator.ERR_OPEN_HAND_DABURI });
    }
    if (config.is_ippatsu && !config.is_riichi && !config.is_daburu_riichi) {
      return new HandResponse({ error: HandCalculator.ERR_IPPATSU_WITHOUT_RIICHI });
    }
    if (config.is_chankan && config.is_tsumo) {
      return new HandResponse({ error: HandCalculator.ERR_CHANKAN_WITH_TSUMO });
    }
    if (config.is_rinshan && !config.is_tsumo) {
      return new HandResponse({ error: HandCalculator.ERR_RINSHAN_WITHOUT_TSUMO });
    }
    if (config.is_haitei && !config.is_tsumo) {
      return new HandResponse({ error: HandCalculator.ERR_HAITEI_WITHOUT_TSUMO });
    }
    if (config.is_houtei && config.is_tsumo) {
      return new HandResponse({ error: HandCalculator.ERR_HOUTEI_WITH_TSUMO });
    }
    if (config.is_haitei && config.is_rinshan) {
      return new HandResponse({ error: HandCalculator.ERR_HAITEI_WITH_RINSHAN });
    }
    if (config.is_houtei && config.is_chankan) {
      return new HandResponse({ error: HandCalculator.ERR_HOUTEI_WITH_CHANKAN });
    }
    if (config.is_tenhou && config.player_wind && !config.is_dealer) {
      return new HandResponse({ error: HandCalculator.ERR_TENHOU_NOT_AS_DEALER });
    }
    if (config.is_tenhou && !config.is_tsumo) {
      return new HandResponse({ error: HandCalculator.ERR_TENHOU_WITHOUT_TSUMO });
    }
    if (config.is_tenhou && melds.length > 0) {
      return new HandResponse({ error: HandCalculator.ERR_TENHOU_WITH_MELD });
    }
    if (config.is_chiihou && config.player_wind && config.is_dealer) {
      return new HandResponse({ error: HandCalculator.ERR_CHIIHOU_AS_DEALER });
    }
    if (config.is_chiihou && !config.is_tsumo) {
      return new HandResponse({ error: HandCalculator.ERR_CHIIHOU_WITHOUT_TSUMO });
    }
    if (config.is_chiihou && melds.length > 0) {
      return new HandResponse({ error: HandCalculator.ERR_CHIIHOU_WITH_MELD });
    }
    if (config.is_renhou && config.player_wind && config.is_dealer) {
      return new HandResponse({ error: HandCalculator.ERR_RENHOU_AS_DEALER });
    }
    if (config.is_renhou && config.is_tsumo) {
      return new HandResponse({ error: HandCalculator.ERR_RENHOU_WITH_TSUMO });
    }
    if (config.is_renhou && melds.length > 0) {
      return new HandResponse({ error: HandCalculator.ERR_RENHOU_WITH_MELD });
    }
    if (config.is_tsubame_gaeshi && config.is_tsumo) {
      return new HandResponse({ error: HandCalculator.ERR_TSUBAME_GAESHI_WITH_TSUMO });
    }
    if (config.is_tsubame_gaeshi && isOpenHand) {
      return new HandResponse({ error: HandCalculator.ERR_TSUBAME_GAESHI_WITH_OPEN_HAND });
    }
    if (config.is_kanfuri && config.is_tsumo) {
      return new HandResponse({ error: HandCalculator.ERR_KANFURI_WITH_TSUMO });
    }

    if (!config.options.has_double_yakuman) {
      config.yaku.daburu_kokushi.han_closed = 13;
      config.yaku.suuankou_tanki.han_closed = 13;
      config.yaku.daburu_chuuren_poutou.han_closed = 13;
      config.yaku.daisuushi.han_closed = 13;
      config.yaku.daisuushi.han_open = 13;
    }

    const handOptions = HandDivider.divide_hand(tiles34, melds);

    const doraCountMap = build_dora_count_map(dora_indicators);
    let precomputedDora = count_dora_for_hand(tiles34, doraCountMap);
    if (config.num_nuki_dora > 0) {
      precomputedDora += (doraCountMap.get(NORTH) ?? 0) * config.num_nuki_dora + config.num_nuki_dora;
    }

    let precomputedAkaDora = 0;
    if (config.options.has_aka_dora) {
      precomputedAkaDora = tiles.filter((t) => AKA_DORAS.has(t)).length;
    }

    let precomputedUraDora = 0;
    if (config.is_riichi || config.is_daburu_riichi) {
      const uraCountMap = build_dora_count_map(ura_dora_indicators);
      precomputedUraDora = count_dora_for_hand(tiles34, uraCountMap);
      if (config.num_nuki_dora > 0) {
        precomputedUraDora += (uraCountMap.get(NORTH) ?? 0) * config.num_nuki_dora;
      }
    }

    const yakuhaiSeatWindYaku = [
      config.yaku.seat_wind_east,
      config.yaku.seat_wind_south,
      config.yaku.seat_wind_west,
      config.yaku.seat_wind_north
    ];
    const yakuhaiRoundWindYaku = [
      config.yaku.round_wind_east,
      config.yaku.round_wind_south,
      config.yaku.round_wind_west,
      config.yaku.round_wind_north
    ];

    const calculatedHands: CalculatedHand[] = [];
    for (const hand of handOptions as Hand[]) {
      const isChiitoitsu = config.yaku.chiitoitsu.is_condition_met(hand);
      const valuedTiles = [HAKU, HATSU, CHUN, config.player_wind, config.round_wind];
      const chiSets: number[][] = [];
      const ponSets: number[][] = [];
      const kanSets: number[][] = [];

      for (const x of hand) {
        if (x.length === 4) kanSets.push(x);
        else if (x.length === 3) {
          if (x[0] === x[1]) ponSets.push(x);
          else chiSets.push(x);
        }
      }

      const isTanyaoHand = config.yaku.tanyao.is_condition_met(hand);
      const [suitMask, honorCount] = classify_hand_suits(hand);
      const hasHonors = honorCount > 0;
      const winGroups = HandCalculator._find_win_groups(win_tile, hand, openedMelds);

      for (const winGroup of winGroups) {
        let cost: ScoresResult<ScoreValue> | null = null;
        let error: string | null = null;
        let handYaku: Yaku[] = [];
        let han = 0;
        const [fuDetails, fu] = FuCalculator.calculate_fu(hand, win_tile, winGroup, config, valuedTiles, melds);
        const isPinfu = fuDetails.length === 1 && !isChiitoitsu && !isOpenHand;

        if (config.is_tsumo && !isOpenHand) handYaku.push(config.yaku.tsumo);
        if (isPinfu) handYaku.push(config.yaku.pinfu);
        if (isChiitoitsu) handYaku.push(config.yaku.chiitoitsu);

        if (config.options.has_daisharin) {
          const isDaisharin = config.yaku.daisharin.is_condition_met(hand, config.options.has_daisharin_other_suits);
          if (isDaisharin) {
            config.yaku.daisharin.rename(hand);
            handYaku.push(config.yaku.daisharin);
          }
        }

        if (config.options.has_daichisei && config.yaku.daichisei.is_condition_met(hand)) {
          handYaku.push(config.yaku.daichisei);
        }

        if ((!isOpenHand || config.options.has_open_tanyao) && isTanyaoHand) handYaku.push(config.yaku.tanyao);

        if (config.is_riichi && !config.is_daburu_riichi) {
          handYaku.push(config.is_open_riichi ? config.yaku.open_riichi : config.yaku.riichi);
        }
        if (config.is_daburu_riichi) {
          handYaku.push(config.is_open_riichi ? config.yaku.daburu_open_riichi : config.yaku.daburu_riichi);
        }
        if (
          !config.is_tsumo &&
          config.options.has_sashikomi_yakuman &&
          (handYaku.includes(config.yaku.daburu_open_riichi) || handYaku.includes(config.yaku.open_riichi))
        ) {
          handYaku.push(config.yaku.sashikomi);
        }
        if (config.is_ippatsu) handYaku.push(config.yaku.ippatsu);
        if (config.is_rinshan) handYaku.push(config.yaku.rinshan);
        if (config.is_chankan) handYaku.push(config.yaku.chankan);
        if (config.is_haitei) handYaku.push(config.yaku.haitei);
        if (config.is_houtei) handYaku.push(config.yaku.houtei);
        if (config.is_renhou) handYaku.push(config.options.renhou_as_yakuman ? config.yaku.renhou_yakuman : config.yaku.renhou);
        if (config.is_tsubame_gaeshi) handYaku.push(config.yaku.tsubame_gaeshi);
        if (config.is_kanfuri) handYaku.push(config.yaku.kanfuri);
        if (config.is_tenhou) handYaku.push(config.yaku.tenhou);
        if (config.is_chiihou) handYaku.push(config.yaku.chiihou);

        if (config.yaku.chinitsu.is_condition_met(hand)) handYaku.push(config.yaku.chinitsu);
        else if (config.yaku.honitsu.is_condition_met(hand)) handYaku.push(config.yaku.honitsu);

        if (chiSets.length === 0) {
          if (hasHonors && config.yaku.tsuisou.is_condition_met(hand)) handYaku.push(config.yaku.tsuisou);
          if (!isTanyaoHand) {
            if (config.yaku.honroto.is_condition_met(hand)) handYaku.push(config.yaku.honroto);
            if (!hasHonors && config.yaku.chinroto.is_condition_met(hand)) handYaku.push(config.yaku.chinroto);
          }
        }

        if (config.yaku.ryuisou.is_condition_met(hand)) handYaku.push(config.yaku.ryuisou);

        if (config.paarenchan > 0 && !config.options.paarenchan_needs_yaku) {
          config.yaku.paarenchan.set_paarenchan_count(config.paarenchan);
          handYaku.push(config.yaku.paarenchan);
        }

        if (chiSets.length > 0) {
          if (!isTanyaoHand) {
            if (config.yaku.chantai.is_condition_met(hand)) handYaku.push(config.yaku.chantai);
            if (config.yaku.junchan.is_condition_met(hand)) handYaku.push(config.yaku.junchan);
            if (config.yaku.ittsu.is_condition_met(hand)) handYaku.push(config.yaku.ittsu);
          }
          if (!isOpenHand) {
            if (config.yaku.ryanpeiko.is_condition_met(hand)) handYaku.push(config.yaku.ryanpeiko);
            else if (config.yaku.iipeiko.is_condition_met(hand)) handYaku.push(config.yaku.iipeiko);
          }
          if (config.options.has_isshoku_yonshun && config.yaku.isshoku_yonshun.is_condition_met(hand)) {
            handYaku.push(config.yaku.isshoku_yonshun);
          }
          if (suitMask === ALL_SUITS_MASK && config.yaku.sanshoku.is_condition_met(hand)) handYaku.push(config.yaku.sanshoku);
        }

        if (ponSets.length > 0 || kanSets.length > 0) {
          if (config.options.has_sanrenkou && config.yaku.sanrenkou.is_condition_met(hand)) {
            handYaku.push(config.yaku.sanrenkou);
          }
          if (config.yaku.toitoi.is_condition_met(hand)) handYaku.push(config.yaku.toitoi);
          if (config.yaku.sanankou.is_condition_met(hand, win_tile, melds, config.is_tsumo)) handYaku.push(config.yaku.sanankou);
          if (suitMask === ALL_SUITS_MASK && config.yaku.sanshoku_douko.is_condition_met(hand)) handYaku.push(config.yaku.sanshoku_douko);
          if (hasHonors) {
            if (config.yaku.shosangen.is_condition_met(hand)) handYaku.push(config.yaku.shosangen);
            if (config.yaku.haku.is_condition_met(hand)) handYaku.push(config.yaku.haku);
            if (config.yaku.hatsu.is_condition_met(hand)) handYaku.push(config.yaku.hatsu);
            if (config.yaku.chun.is_condition_met(hand)) handYaku.push(config.yaku.chun);
            for (const yaku of yakuhaiSeatWindYaku) {
              if (yaku.is_condition_met(hand, config.player_wind)) handYaku.push(yaku);
            }
            for (const yaku of yakuhaiRoundWindYaku) {
              if (yaku.is_condition_met(hand, config.round_wind)) handYaku.push(yaku);
            }
            if (config.yaku.daisangen.is_condition_met(hand)) handYaku.push(config.yaku.daisangen);
            if (config.yaku.shosuushi.is_condition_met(hand)) handYaku.push(config.yaku.shosuushi);
            if (config.yaku.daisuushi.is_condition_met(hand)) handYaku.push(config.yaku.daisuushi);
          }
          if (melds.length === 0 && !isTanyaoHand && config.yaku.chuuren_poutou.is_condition_met(hand)) {
            if (tiles34[Math.floor(win_tile / 4)] === 2 || tiles34[Math.floor(win_tile / 4)] === 4) {
              handYaku.push(config.yaku.daburu_chuuren_poutou);
            } else {
              handYaku.push(config.yaku.chuuren_poutou);
            }
          }
          if (!isOpenHand && config.yaku.suuankou.is_condition_met(hand, win_tile, config.is_tsumo)) {
            if (tiles34[Math.floor(win_tile / 4)] === 2) handYaku.push(config.yaku.suuankou_tanki);
            else handYaku.push(config.yaku.suuankou);
          }
          if (config.yaku.sankantsu.is_condition_met(hand, melds)) handYaku.push(config.yaku.sankantsu);
          if (config.yaku.suukantsu.is_condition_met(hand, melds)) handYaku.push(config.yaku.suukantsu);
        }

        if (config.paarenchan > 0 && config.options.paarenchan_needs_yaku && handYaku.length > 0) {
          config.yaku.paarenchan.set_paarenchan_count(config.paarenchan);
          handYaku.push(config.yaku.paarenchan);
        }

        let yakumanList = handYaku.filter((x) => x.is_yakuman);
        if (yakumanList.length > 0) {
          if (!isAotenjou) {
            handYaku = yakumanList;
          } else {
            (scoresCalculator as Aotenjou).aotenjou_filter_yaku(handYaku, config);
            yakumanList = [];
          }
        }

        for (const item of handYaku) {
          if (isOpenHand && item.han_open) han += item.han_open;
          else han += item.han_closed;
        }

        if (han === 0) {
          error = HandCalculator.ERR_NO_YAKU;
          cost = null;
        }

        if (yakumanList.length === 0 && !error) {
          if (precomputedDora) {
            config.yaku.dora.han_open = precomputedDora;
            config.yaku.dora.han_closed = precomputedDora;
            handYaku.push(config.yaku.dora);
            han += precomputedDora;
          }
          if (precomputedAkaDora) {
            config.yaku.aka_dora.han_open = precomputedAkaDora;
            config.yaku.aka_dora.han_closed = precomputedAkaDora;
            handYaku.push(config.yaku.aka_dora);
            han += precomputedAkaDora;
          }
          if (precomputedUraDora) {
            config.yaku.ura_dora.han_closed = precomputedUraDora;
            handYaku.push(config.yaku.ura_dora);
            han += precomputedUraDora;
          }
        }

        if (!isAotenjou && config.options.limit_to_sextuple_yakuman && han > 78) {
          han = 78;
        }

        if (!error) {
          cost = scoresCalculator.calculate_scores(han, fu, config, yakumanList.length > 0);
        }

        calculatedHands.push({ cost, error, hand_yaku: handYaku, han, fu, fu_details: fuDetails });
      }
    }

    if (
      !isOpenHand &&
      config.options.has_shiisanpuutaa &&
      config.yaku.shiisanpuutaa.is_condition_met(null, tiles34)
    ) {
      let handYaku: Yaku[] = [config.yaku.shiisanpuutaa];

      if (config.is_tsumo) handYaku.push(config.yaku.tsumo);
      if (config.is_riichi && !config.is_daburu_riichi) {
        handYaku.push(config.is_open_riichi ? config.yaku.open_riichi : config.yaku.riichi);
      }
      if (config.is_daburu_riichi) {
        handYaku.push(config.is_open_riichi ? config.yaku.daburu_open_riichi : config.yaku.daburu_riichi);
      }
      if (config.is_ippatsu) handYaku.push(config.yaku.ippatsu);
      if (config.is_rinshan) handYaku.push(config.yaku.rinshan);
      if (config.is_chankan) handYaku.push(config.yaku.chankan);
      if (config.is_haitei) handYaku.push(config.yaku.haitei);
      if (config.is_houtei) handYaku.push(config.yaku.houtei);
      if (config.is_renhou) {
        handYaku.push(config.options.renhou_as_yakuman ? config.yaku.renhou_yakuman : config.yaku.renhou);
      }
      if (config.is_tsubame_gaeshi) handYaku.push(config.yaku.tsubame_gaeshi);
      if (config.is_kanfuri) handYaku.push(config.yaku.kanfuri);
      if (config.is_tenhou) handYaku.push(config.yaku.tenhou);
      if (config.is_chiihou) handYaku.push(config.yaku.chiihou);

      let yakumanList = handYaku.filter((yaku) => yaku.is_yakuman);
      if (yakumanList.length > 0) {
        if (!isAotenjou) {
          handYaku = yakumanList;
        } else {
          (scoresCalculator as Aotenjou).aotenjou_filter_yaku(handYaku, config);
          yakumanList = [];
        }
      }

      let han = handYaku.reduce((total, yaku) => total + yaku.han_closed, 0);
      if (yakumanList.length === 0) {
        if (precomputedDora) {
          config.yaku.dora.han_open = precomputedDora;
          config.yaku.dora.han_closed = precomputedDora;
          handYaku.push(config.yaku.dora);
          han += precomputedDora;
        }
        if (precomputedAkaDora) {
          config.yaku.aka_dora.han_open = precomputedAkaDora;
          config.yaku.aka_dora.han_closed = precomputedAkaDora;
          handYaku.push(config.yaku.aka_dora);
          han += precomputedAkaDora;
        }
        if (precomputedUraDora) {
          config.yaku.ura_dora.han_closed = precomputedUraDora;
          handYaku.push(config.yaku.ura_dora);
          han += precomputedUraDora;
        }
      }

      const fu = 30;
      const cost = scoresCalculator.calculate_scores(han, fu, config, yakumanList.length > 0);
      calculatedHands.push({ cost, error: null, hand_yaku: handYaku, han, fu, fu_details: [] });
    }

    if (!isOpenHand && config.yaku.kokushi.is_condition_met(null, tiles34)) {
      const handYaku: Yaku[] = [];
      if (tiles34[Math.floor(win_tile / 4)] === 2) handYaku.push(config.yaku.daburu_kokushi);
      else handYaku.push(config.yaku.kokushi);

      if (!config.is_tsumo && config.options.has_sashikomi_yakuman && config.is_open_riichi && (config.is_daburu_riichi || config.is_riichi)) {
        handYaku.push(config.yaku.sashikomi);
      }
      if (config.is_renhou && config.options.renhou_as_yakuman) handYaku.push(config.yaku.renhou_yakuman);
      if (config.is_tenhou) handYaku.push(config.yaku.tenhou);
      if (config.is_chiihou) handYaku.push(config.yaku.chiihou);
      if (config.paarenchan > 0) {
        config.yaku.paarenchan.set_paarenchan_count(config.paarenchan);
        handYaku.push(config.yaku.paarenchan);
      }

      let han = handYaku.reduce((total, item) => total + item.han_closed, 0);
      let fu = 0;
      if (isAotenjou) {
        fu = config.is_tsumo ? 30 : 40;
        let countOfDora = 0;
        for (const tile of tiles) countOfDora += plus_dora(tile, dora_indicators);
        if (countOfDora) {
          config.yaku.dora.han_open = countOfDora;
          config.yaku.dora.han_closed = countOfDora;
          handYaku.push(config.yaku.dora);
          han += countOfDora;
        }
        if (config.is_riichi || config.is_daburu_riichi) {
          let countOfUraDora = 0;
          for (const tile of tiles) countOfUraDora += plus_dora(tile, ura_dora_indicators);
          if (countOfUraDora) {
            config.yaku.ura_dora.han_closed = countOfUraDora;
            handYaku.push(config.yaku.ura_dora);
            han += countOfUraDora;
          }
        }
      }
      const cost = scoresCalculator.calculate_scores(han, fu, config, handYaku.length > 0);
      calculatedHands.push({ cost, error: null, hand_yaku: handYaku, han, fu, fu_details: [] });
    }

    if (calculatedHands.length === 0) {
      return new HandResponse({ error: HandCalculator.ERR_HAND_NOT_WINNING });
    }

    calculatedHands.sort((a, b) => b.han - a.han || b.fu - a.fu);
    const bestHan = calculatedHands[0].han;
    const bestFu = calculatedHands[0].fu;
    const filtered = calculatedHands
      .filter((x) => x.han === bestHan && x.fu === bestFu)
      .sort((a, b) => b.fu_details.reduce((s, y) => s + y.fu, 0) - a.fu_details.reduce((s, y) => s + y.fu, 0));
    const calculatedHand = filtered[0];

    if (calculatedHand.error) {
      return new HandResponse({ error: calculatedHand.error });
    }

    return new HandResponse({
      cost: calculatedHand.cost,
      han: calculatedHand.han,
      fu: calculatedHand.fu,
      yaku: calculatedHand.hand_yaku,
      error: calculatedHand.error,
      fu_details: calculatedHand.fu_details,
      is_open_hand: isOpenHand
    });
  }

  static _find_win_groups(win_tile: number, hand: number[][], opened_melds: number[][]): number[][] {
    const winTile34 = Math.floor((win_tile || 0) / 4);
    const consumed = Array(opened_melds.length).fill(false);
    const seen = new Set<string>();
    const winGroups: number[][] = [];
    for (const x of hand) {
      let isOpenedMeld = false;
      for (let i = 0; i < opened_melds.length; i += 1) {
        if (!consumed[i] && arraysEqual(x, opened_melds[i])) {
          consumed[i] = true;
          isOpenedMeld = true;
          break;
        }
      }
      if (isOpenedMeld) continue;
      if (x.includes(winTile34)) {
        const key = x.join(",");
        if (!seen.has(key)) {
          seen.add(key);
          winGroups.push(x);
        }
      }
    }
    return winGroups;
  }
}

function arraysEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
