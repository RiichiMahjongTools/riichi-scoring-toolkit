import {
  HandCalculator,
  HandConfig,
  OptionalRules,
  type FuDetail,
  type Yaku,
} from 'mahjong-ts';
import { calculateHandEfficiency, type EfficiencyResult } from './efficiency';
import {
  calculateScoreCost,
  type LimitClass,
  type PointResult,
  type WinMethod,
} from './points';
import { countRedDora, type Tile, type Wind } from './tiles';
import {
  expectedClosedTileCount,
  isValidEfficiencyTileCount,
  validateScoreInput,
  type ScoreInput,
  type ScoreMode,
} from './validation';

export interface YakuResultItem {
  id: string;
  name: string;
  han: number | 'yakuman' | 'double-yakuman';
  source: 'hand' | 'condition' | 'dora';
}

export interface ScoreCalculationOptions {
  enableLegacyYaku?: boolean;
}

export interface FuBreakdownItem {
  reason: string;
  name: string;
  fu: number;
}

export interface ScoreResult {
  mode: ScoreMode;
  valid: boolean;
  yaku: YakuResultItem[];
  han: number;
  fu?: number;
  fu_details?: FuBreakdownItem[];
  limit?: LimitClass | null;
  yaku_level: string;
  yaku_level_label?: string | null;
  cost?: PointResult['cost'];
  is_dealer: boolean;
  is_tsumo: boolean;
  warnings: string[];
}

export type ScoreComputation =
  | { kind: 'score'; result: ScoreResult }
  | { kind: 'efficiency'; result: EfficiencyResult }
  | { kind: 'invalid'; errors: string[]; warnings: string[] };

const WIND_TO_TILE_34: Record<Wind, number> = {
  east: 27,
  south: 28,
  west: 29,
  north: 30,
};

const YAKU_NAME_ZH: Record<number, string> = {
  0: '门前清自摸和',
  1: '立直',
  2: '开放立直',
  3: '一发',
  4: '抢杠',
  5: '岭上开花',
  6: '海底摸月',
  7: '河底捞鱼',
  8: '两立直',
  10: '流局满贯',
  11: '人和',
  12: '平和',
  13: '断幺九',
  14: '一杯口',
  15: '役牌（白）',
  16: '役牌（发）',
  17: '役牌（中）',
  18: '役牌（自风东）',
  19: '役牌（自风南）',
  20: '役牌（自风西）',
  21: '役牌（自风北）',
  22: '役牌（场风东）',
  23: '役牌（场风南）',
  24: '役牌（场风西）',
  25: '役牌（场风北）',
  26: '三色同顺',
  27: '一气通贯',
  28: '混全带幺九',
  29: '混老头',
  30: '对对和',
  31: '三暗刻',
  32: '三杠子',
  33: '三色同刻',
  34: '七对子',
  35: '小三元',
  36: '混一色',
  37: '纯全带幺九',
  38: '二杯口',
  39: '清一色',
  100: '国士无双',
  101: '九莲宝灯',
  102: '四暗刻',
  103: '大三元',
  104: '小四喜',
  105: '绿一色',
  106: '四杠子',
  107: '字一色',
  108: '清老头',
  109: '大车轮',
  110: '大七星',
  111: '大四喜',
  112: '国士无双十三面',
  113: '四暗刻单骑',
  114: '纯正九莲宝灯',
  115: '天和',
  116: '地和',
  117: '人和（役满）',
  120: '宝牌',
  121: '赤宝牌',
  122: '里宝牌',
  123: '三连刻',
  124: '一色四顺',
  125: '十三不塔',
  126: '燕返',
  127: '杠振',
};

const CONDITION_YAKU_IDS = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 115, 116, 117, 126, 127]);
const DORA_YAKU_IDS = new Set([120, 121, 122]);

const FU_REASON_ZH: Record<string, string> = {
  base: '底符',
  penchan: '边张',
  kanchan: '坎张',
  valued_pair: '役牌雀头',
  double_valued_pair: '连风雀头',
  pair_wait: '单骑',
  tsumo: '自摸',
  hand_without_fu: '副露平和形',
  closed_pon: '中张暗刻',
  open_pon: '中张明刻',
  closed_terminal_pon: '幺九暗刻',
  open_terminal_pon: '幺九明刻',
  closed_kan: '中张暗杠',
  open_kan: '中张明杠',
  closed_terminal_kan: '幺九暗杠',
  open_terminal_kan: '幺九明杠',
};

const ERROR_MESSAGES: Record<string, string> = {
  [HandCalculator.ERR_NO_WINNING_TILE]: '和牌张必须在手牌内',
  [HandCalculator.ERR_HAND_NOT_WINNING]: '未能组成和牌形，显示牌效估算',
  [HandCalculator.ERR_NO_YAKU]: '手牌可以组成和牌形，但没有役，不能计分',
  [HandCalculator.ERR_OPEN_HAND_RIICHI]: '副露手牌不能立直',
  [HandCalculator.ERR_OPEN_HAND_DABURI]: '副露手牌不能两立直',
  [HandCalculator.ERR_IPPATSU_WITHOUT_RIICHI]: '一发必须与立直或两立直同时成立',
  [HandCalculator.ERR_CHANKAN_WITH_TSUMO]: '抢杠属于荣和条件，不能与自摸同时选择',
  [HandCalculator.ERR_RINSHAN_WITHOUT_TSUMO]: '岭上开花必须按自摸计算',
  [HandCalculator.ERR_HAITEI_WITHOUT_TSUMO]: '海底摸月必须按自摸计算',
  [HandCalculator.ERR_HOUTEI_WITH_TSUMO]: '河底捞鱼必须按荣和计算',
  [HandCalculator.ERR_HAITEI_WITH_RINSHAN]: '海底与岭上不能同时成立',
  [HandCalculator.ERR_HOUTEI_WITH_CHANKAN]: '河底与抢杠不能同时成立',
  [HandCalculator.ERR_TENHOU_NOT_AS_DEALER]: '天和只适用于庄家',
  [HandCalculator.ERR_TENHOU_WITHOUT_TSUMO]: '天和必须按自摸计算',
  [HandCalculator.ERR_TENHOU_WITH_MELD]: '天和不能有副露',
  [HandCalculator.ERR_CHIIHOU_AS_DEALER]: '地和只适用于子家',
  [HandCalculator.ERR_CHIIHOU_WITHOUT_TSUMO]: '地和必须按自摸计算',
  [HandCalculator.ERR_CHIIHOU_WITH_MELD]: '地和不能有副露',
  [HandCalculator.ERR_RENHOU_AS_DEALER]: '人和只适用于子家',
  [HandCalculator.ERR_RENHOU_WITH_TSUMO]: '人和必须按荣和计算',
  [HandCalculator.ERR_RENHOU_WITH_MELD]: '人和不能有副露',
  [HandCalculator.ERR_TSUBAME_GAESHI_WITH_TSUMO]: '燕返必须按荣和计算',
  [HandCalculator.ERR_TSUBAME_GAESHI_WITH_OPEN_HAND]: '燕返是门前限定役，不能有明副露',
  [HandCalculator.ERR_KANFURI_WITH_TSUMO]: '杠振必须按荣和计算',
};

function getWinMethod(input: ScoreInput): WinMethod {
  return input.conditions.tsumo ? 'tsumo' : 'ron';
}

function isDealer(input: ScoreInput): boolean {
  return input.seatWind === 'east';
}

function isYakuman(yaku: Yaku): boolean {
  return yaku.is_yakuman || yaku.han_closed >= 13 || yaku.han_open >= 13;
}

function yakuHan(yaku: Yaku, open: boolean): YakuResultItem['han'] {
  const han = open && yaku.han_open ? yaku.han_open : yaku.han_closed;
  if (isYakuman(yaku)) return han >= 26 ? 'double-yakuman' : 'yakuman';
  return han;
}

function yakuSource(yaku: Yaku): YakuResultItem['source'] {
  if (DORA_YAKU_IDS.has(yaku.yaku_id)) return 'dora';
  if (CONDITION_YAKU_IDS.has(yaku.yaku_id)) return 'condition';
  return 'hand';
}

function yakuNameZh(yaku: Yaku): string {
  if (yaku.yaku_id === 109) {
    if (yaku.name === 'Daisuurin') return '大数邻';
    if (yaku.name === 'Daichikurin') return '大竹林';
  }
  return YAKU_NAME_ZH[yaku.yaku_id] ?? yaku.name;
}

function mapYaku(yaku: readonly Yaku[] | null, open: boolean): YakuResultItem[] {
  return (yaku ?? []).map((entry) => ({
    id: String(entry.yaku_id),
    name: yakuNameZh(entry),
    han: yakuHan(entry, open),
    source: yakuSource(entry),
  }));
}

function mapFuDetails(details: readonly FuDetail[] | null): FuBreakdownItem[] {
  return (details ?? []).map((detail) => ({
    reason: detail.reason,
    name: FU_REASON_ZH[detail.reason] ?? detail.reason,
    fu: detail.fu,
  }));
}

function buildHandConfig(input: ScoreInput, enableLegacyYaku: boolean): HandConfig {
  const hasAkaDora = countRedDora([...input.handTiles, ...input.melds.flatMap((meld) => meld.tiles)]) > 0;
  return new HandConfig({
    is_tsumo: input.conditions.tsumo,
    is_riichi: input.conditions.riichi,
    is_ippatsu: input.conditions.ippatsu,
    is_rinshan: input.conditions.rinshan,
    is_chankan: input.conditions.chankan,
    is_haitei: input.conditions.haiteiOrHoutei && input.conditions.tsumo,
    is_houtei: input.conditions.haiteiOrHoutei && !input.conditions.tsumo,
    is_daburu_riichi: input.conditions.doubleRiichi,
    is_tenhou: input.conditions.tenhou,
    is_chiihou: input.conditions.chiihou,
    is_renhou: input.conditions.renhou,
    is_tsubame_gaeshi: input.conditions.tsubameGaeshi,
    is_kanfuri: input.conditions.kanfuri,
    player_wind: WIND_TO_TILE_34[input.seatWind],
    round_wind: WIND_TO_TILE_34[input.roundWind],
    tsumi_number: input.honba,
    num_nuki_dora: input.mode === 'sanma' ? input.northDoraCount : 0,
    options: new OptionalRules({
      has_open_tanyao: true,
      has_aka_dora: hasAkaDora,
      is_three_player: input.mode === 'sanma',
      double_wind_pair_fu: input.doubleWindPairTwoFu ? 2 : 4,
      has_daisharin_other_suits: enableLegacyYaku,
      has_sanrenkou: enableLegacyYaku,
      has_isshoku_yonshun: enableLegacyYaku,
      has_shiisanpuutaa: enableLegacyYaku,
    }),
  });
}

function buildNoYakuResult(input: ScoreInput, warnings: readonly string[]): ScoreResult {
  return {
    mode: input.mode,
    valid: false,
    yaku: [],
    han: 0,
    yaku_level: '',
    yaku_level_label: null,
    is_dealer: isDealer(input),
    is_tsumo: input.conditions.tsumo,
    warnings: [...warnings, ERROR_MESSAGES[HandCalculator.ERR_NO_YAKU]],
  };
}

export function calculateScoreOrEfficiency(
  input: ScoreInput,
  options: ScoreCalculationOptions = {},
): ScoreComputation {
  const validation = validateScoreInput(input);
  if (!validation.ok) return { kind: 'invalid', errors: validation.errors, warnings: validation.warnings };

  if (!isValidEfficiencyTileCount(input.handTiles.length, input.melds.length)) {
    const completeTileCount = expectedClosedTileCount(input.melds.length);
    return {
      kind: 'invalid',
      errors: [
        `牌数与副露数量不匹配：${input.melds.length} 组副露时，牌效计算需要 ${completeTileCount - 1} 或 ${completeTileCount} 张闭合手牌，当前 ${input.handTiles.length} 张`,
      ],
      warnings: validation.warnings,
    };
  }

  if (input.handTiles.length + input.melds.length * 3 !== 14 || input.winTile === null) {
    return {
      kind: 'efficiency',
      result: calculateHandEfficiency({
        mode: input.mode,
        handTiles: input.handTiles,
        melds: input.melds,
        warnings: validation.warnings,
      }),
    };
  }

  const warnings = [...validation.warnings];
  if (input.uraDoraIndicators.length > 0 && !input.conditions.riichi && !input.conditions.doubleRiichi) {
    warnings.push('未立直时里宝牌不会计入番数');
  }
  if (input.mode === 'yonma' && input.northDoraCount > 0) warnings.push('四麻结果已忽略拔北宝牌');

  const tiles = [...input.handTiles, ...input.melds.flatMap((meld) => meld.tiles)];
  const handResult = HandCalculator.estimate_hand_value(
    tiles,
    input.winTile,
    input.melds,
    input.doraIndicators,
    buildHandConfig(input, options.enableLegacyYaku ?? false),
    undefined,
    input.uraDoraIndicators,
  );

  if (handResult.error === HandCalculator.ERR_NO_YAKU) {
    return { kind: 'score', result: buildNoYakuResult(input, warnings) };
  }

  if (handResult.error === HandCalculator.ERR_HAND_NOT_WINNING) {
    return {
      kind: 'efficiency',
      result: calculateHandEfficiency({
        mode: input.mode,
        handTiles: input.handTiles,
        melds: input.melds,
        warnings: [...warnings, ERROR_MESSAGES[handResult.error]],
      }),
    };
  }

  if (handResult.error) {
    return {
      kind: 'invalid',
      errors: [ERROR_MESSAGES[handResult.error] ?? handResult.error],
      warnings,
    };
  }

  if (handResult.han === null || handResult.fu === null) {
    return { kind: 'invalid', errors: ['mahjong-ts 未返回和牌番符明细'], warnings };
  }

  const scoreCost = calculateScoreCost({
    han: handResult.han,
    fu: handResult.fu,
    is_dealer: isDealer(input),
    is_tsumo: input.conditions.tsumo,
    tsumi_number: input.honba,
    is_three_player: input.mode === 'sanma',
    is_yakuman: Boolean(handResult.yaku?.some(isYakuman)),
  });

  return {
    kind: 'score',
    result: {
      mode: input.mode,
      valid: true,
      yaku: mapYaku(handResult.yaku, handResult.is_open_hand),
      han: handResult.han,
      fu: handResult.fu,
      fu_details: mapFuDetails(handResult.fu_details),
      limit: scoreCost.limit,
      yaku_level: scoreCost.yaku_level,
      yaku_level_label: scoreCost.yaku_level_label,
      cost: scoreCost.cost,
      is_dealer: scoreCost.is_dealer,
      is_tsumo: scoreCost.is_tsumo,
      warnings,
    },
  };
}
