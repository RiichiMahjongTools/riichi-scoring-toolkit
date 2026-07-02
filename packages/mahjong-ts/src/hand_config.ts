import { EAST } from "./constants";
import { YakuConfig } from "./yaku";

export class HandConstants {
  static KAZOE_LIMITED = 0;
  static KAZOE_SANBAIMAN = 1;
  static KAZOE_NO_LIMIT = 2;

  KAZOE_LIMITED = HandConstants.KAZOE_LIMITED;
  KAZOE_SANBAIMAN = HandConstants.KAZOE_SANBAIMAN;
  KAZOE_NO_LIMIT = HandConstants.KAZOE_NO_LIMIT;
}

export class OptionalRules {
  has_open_tanyao: boolean;
  has_aka_dora: boolean;
  has_double_yakuman: boolean;
  kazoe_limit: number;
  kiriage: boolean;
  fu_for_open_pinfu: boolean;
  fu_for_pinfu_tsumo: boolean;
  renhou_as_yakuman: boolean;
  has_daisharin: boolean;
  has_daisharin_other_suits: boolean;
  has_daichisei: boolean;
  has_sashikomi_yakuman: boolean;
  limit_to_sextuple_yakuman: boolean;
  paarenchan_needs_yaku: boolean;
  is_three_player: boolean;
  double_wind_pair_fu: 2 | 4;

  constructor(params: Partial<OptionalRules> = {}) {
    this.has_open_tanyao = params.has_open_tanyao ?? false;
    this.has_aka_dora = params.has_aka_dora ?? false;
    this.has_double_yakuman = params.has_double_yakuman ?? true;
    this.kazoe_limit = params.kazoe_limit ?? HandConstants.KAZOE_LIMITED;
    this.kiriage = params.kiriage ?? false;
    this.fu_for_open_pinfu = params.fu_for_open_pinfu ?? true;
    this.fu_for_pinfu_tsumo = params.fu_for_pinfu_tsumo ?? false;
    this.renhou_as_yakuman = params.renhou_as_yakuman ?? false;
    this.has_daisharin_other_suits = params.has_daisharin_other_suits ?? false;
    this.has_daisharin = (params.has_daisharin ?? false) || this.has_daisharin_other_suits;
    this.has_daichisei = params.has_daichisei ?? false;
    this.has_sashikomi_yakuman = params.has_sashikomi_yakuman ?? false;
    this.limit_to_sextuple_yakuman = params.limit_to_sextuple_yakuman ?? true;
    this.paarenchan_needs_yaku = params.paarenchan_needs_yaku ?? true;
    this.is_three_player = params.is_three_player ?? false;
    this.double_wind_pair_fu = params.double_wind_pair_fu ?? 4;
  }
}

export class HandConfig extends HandConstants {
  yaku: YakuConfig;
  options: OptionalRules;

  is_tsumo: boolean;
  is_riichi: boolean;
  is_ippatsu: boolean;
  is_rinshan: boolean;
  is_chankan: boolean;
  is_haitei: boolean;
  is_houtei: boolean;
  is_daburu_riichi: boolean;
  is_nagashi_mangan: boolean;
  is_tenhou: boolean;
  is_renhou: boolean;
  is_chiihou: boolean;
  is_open_riichi: boolean;

  is_dealer: boolean;
  player_wind: number | null;
  round_wind: number | null;
  paarenchan: number;
  kyoutaku_number: number;
  tsumi_number: number;
  num_nuki_dora: number;

  constructor(params: {
    is_tsumo?: boolean;
    is_riichi?: boolean;
    is_ippatsu?: boolean;
    is_rinshan?: boolean;
    is_chankan?: boolean;
    is_haitei?: boolean;
    is_houtei?: boolean;
    is_daburu_riichi?: boolean;
    is_nagashi_mangan?: boolean;
    is_tenhou?: boolean;
    is_renhou?: boolean;
    is_chiihou?: boolean;
    is_open_riichi?: boolean;
    player_wind?: number | null;
    round_wind?: number | null;
    kyoutaku_number?: number;
    tsumi_number?: number;
    paarenchan?: number;
    options?: OptionalRules | null;
    num_nuki_dora?: number;
  } = {}) {
    super();
    this.yaku = new YakuConfig();
    this.options = params.options ?? new OptionalRules();

    this.is_tsumo = params.is_tsumo ?? false;
    this.is_riichi = params.is_riichi ?? false;
    this.is_ippatsu = params.is_ippatsu ?? false;
    this.is_rinshan = params.is_rinshan ?? false;
    this.is_chankan = params.is_chankan ?? false;
    this.is_haitei = params.is_haitei ?? false;
    this.is_houtei = params.is_houtei ?? false;
    this.is_daburu_riichi = params.is_daburu_riichi ?? false;
    this.is_nagashi_mangan = params.is_nagashi_mangan ?? false;
    this.is_tenhou = params.is_tenhou ?? false;
    this.is_renhou = params.is_renhou ?? false;
    this.is_chiihou = params.is_chiihou ?? false;
    this.is_open_riichi = params.is_open_riichi ?? false;

    this.player_wind = params.player_wind ?? null;
    this.round_wind = params.round_wind ?? null;
    this.is_dealer = this.player_wind === EAST;
    this.paarenchan = params.paarenchan ?? 0;
    this.kyoutaku_number = params.kyoutaku_number ?? 0;
    this.tsumi_number = params.tsumi_number ?? 0;
    this.num_nuki_dora = params.num_nuki_dora ?? 0;
  }
}
