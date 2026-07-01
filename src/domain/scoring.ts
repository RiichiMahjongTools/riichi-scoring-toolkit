import riichiPkg from 'riichi-mahjong';
import { calculateHandEfficiency, type EfficiencyResult } from './efficiency';
import { calculatePoint, type LimitClass, type PointResult, type WinMethod } from './points';
import { type Tile, type TileCode, type Wind } from './tiles';
import {
  validateScoreInput,
  type MeldInput,
  type ScoreInput,
  type ScoreMode,
} from './validation';

type RiichiCalc = (
  handParams: { closedTiles: number[]; openParts: [boolean, number[]][] },
  options: Record<string, unknown>,
) => RiichiCalcResult;

interface RiichiCalcResult {
  isWin: boolean;
  message: string;
  data?: {
    yaku: Array<{ code: string; name: string; han: number; isYakuman?: boolean; isDoubleYakuman?: boolean }>;
    dora: Array<{ type: string; number: number; tile?: { code?: number } }>;
    han: number;
    fu: {
      fu: number;
      fuReal: number;
      fuDetails: Array<{ name: string; fu: number; tileCode?: number }>;
    };
    score: {
      hanLimit: string;
    };
  };
}

interface RiichiRuntime {
  ETile: Record<string, number>;
  WindType: Record<string, number>;
}

export interface YakuResultItem {
  id: string;
  name: string;
  han: number | 'yakuman' | 'double-yakuman';
  source: 'hand' | 'condition' | 'dora';
}

export interface FuBreakdownItem {
  name: string;
  fu: number;
}

export interface ScoreResult {
  mode: ScoreMode;
  valid: boolean;
  yaku: YakuResultItem[];
  han: number;
  fu?: number;
  fuReal?: number;
  fuBreakdown?: FuBreakdownItem[];
  limit?: LimitClass;
  limitLabel?: string;
  payments?: PointResult['payments'];
  warnings: string[];
}

export type ScoreComputation =
  | { kind: 'score'; result: ScoreResult }
  | { kind: 'efficiency'; result: EfficiencyResult }
  | { kind: 'invalid'; errors: string[]; warnings: string[] };

const FALLBACK_ETILE: Record<string, number> = {
  M1: 0,
  M2: 1,
  M3: 2,
  M4: 3,
  M5: 4,
  M6: 5,
  M7: 6,
  M8: 7,
  M9: 8,
  P1: 9,
  P2: 10,
  P3: 11,
  P4: 12,
  P5: 13,
  P6: 14,
  P7: 15,
  P8: 16,
  P9: 17,
  S1: 18,
  S2: 19,
  S3: 20,
  S4: 21,
  S5: 22,
  S6: 23,
  S7: 24,
  S8: 25,
  S9: 26,
  EAST: 27,
  SOUTH: 28,
  WEST: 29,
  NORTH: 30,
  HAKU: 31,
  HATSU: 32,
  CHUN: 33,
  RED_M5: 34,
  RED_P5: 35,
  RED_S5: 36,
};

const FALLBACK_WIND_TYPE: Record<string, number> = {
  EAST: 1,
  SOUTH: 2,
  WEST: 3,
  NORTH: 4,
};

function unwrapRiichiPackage(pkg: unknown): { calc: RiichiCalc; runtime: RiichiRuntime } {
  const raw = pkg as Record<string, unknown>;
  const candidates = [
    raw,
    raw.default,
    raw['module.exports'],
    (raw.default as Record<string, unknown> | undefined)?.default,
    (raw.default as Record<string, unknown> | undefined)?.['module.exports'],
  ] as Array<(Partial<RiichiRuntime> & { default?: unknown }) | RiichiCalc | undefined>;

  const calc =
    candidates.find((candidate): candidate is RiichiCalc => typeof candidate === 'function') ??
    candidates
      .map((candidate) => (typeof candidate === 'object' && candidate ? candidate.default : undefined))
      .find((candidate): candidate is RiichiCalc => typeof candidate === 'function');
  if (!calc) throw new Error('Cannot load riichi-mahjong CommonJS calc function');

  const enumRuntime = candidates.find(
    (candidate): candidate is RiichiRuntime =>
      typeof candidate === 'object' && candidate !== null && Boolean(candidate.ETile) && Boolean(candidate.WindType),
  );

  return {
    calc,
    runtime: {
      ETile: enumRuntime?.ETile ?? FALLBACK_ETILE,
      WindType: enumRuntime?.WindType ?? FALLBACK_WIND_TYPE,
    },
  };
}

const { calc: riichiCalc, runtime: riichi } = unwrapRiichiPackage(riichiPkg);

const TILE_TO_RIICHI_KEY: Record<TileCode, string> = {
  m1: 'M1',
  m2: 'M2',
  m3: 'M3',
  m4: 'M4',
  m5: 'M5',
  m5r: 'RED_M5',
  m6: 'M6',
  m7: 'M7',
  m8: 'M8',
  m9: 'M9',
  p1: 'P1',
  p2: 'P2',
  p3: 'P3',
  p4: 'P4',
  p5: 'P5',
  p5r: 'RED_P5',
  p6: 'P6',
  p7: 'P7',
  p8: 'P8',
  p9: 'P9',
  s1: 'S1',
  s2: 'S2',
  s3: 'S3',
  s4: 'S4',
  s5: 'S5',
  s5r: 'RED_S5',
  s6: 'S6',
  s7: 'S7',
  s8: 'S8',
  s9: 'S9',
  z1: 'EAST',
  z2: 'SOUTH',
  z3: 'WEST',
  z4: 'NORTH',
  z5: 'HAKU',
  z6: 'HATSU',
  z7: 'CHUN',
};

const WIND_TO_RIICHI_KEY: Record<Wind, string> = {
  east: 'EAST',
  south: 'SOUTH',
  west: 'WEST',
  north: 'NORTH',
};

function toRiichiTile(tile: Tile): number {
  const key = TILE_TO_RIICHI_KEY[tile.code];
  const value = riichi.ETile[key];
  if (typeof value !== 'number') throw new Error(`riichi-mahjong ETile missing ${key}`);
  return value;
}

function toRiichiWind(wind: Wind): number {
  const key = WIND_TO_RIICHI_KEY[wind];
  const value = riichi.WindType[key];
  if (typeof value !== 'number') throw new Error(`riichi-mahjong WindType missing ${key}`);
  return value;
}

function toOpenParts(melds: readonly MeldInput[]): [boolean, number[]][] {
  return melds.map((meld) => [meld.kind !== 'closedKan', meld.tiles.map(toRiichiTile)]);
}

function getWinMethod(input: ScoreInput): WinMethod {
  return input.conditions.tsumo ? 'tsumo' : 'ron';
}

function isDealer(input: ScoreInput): boolean {
  return input.seatWind === 'east';
}

function applySanmaTsumoLoss(point: PointResult, input: ScoreInput): PointResult {
  if (input.mode !== 'sanma' || getWinMethod(input) !== 'tsumo') return point;

  if (isDealer(input)) {
    const tsumoAllPays = point.payments.tsumoAllPays ?? 0;
    return {
      ...point,
      payments: {
        ...point.payments,
        totalGain: tsumoAllPays * 2,
      },
    };
  }

  const dealerPays = point.payments.tsumoDealerPays ?? 0;
  const nonDealerPays = point.payments.tsumoNonDealerPays ?? 0;
  return {
    ...point,
    payments: {
      ...point.payments,
      totalGain: dealerPays + nonDealerPays,
    },
  };
}

function mapRiichiLimit(limit: string | undefined): LimitClass | undefined {
  if (
    limit === 'mangan' ||
    limit === 'haneman' ||
    limit === 'baiman' ||
    limit === 'sanbaiman' ||
    limit === 'yakuman' ||
    limit === 'double-yakuman' ||
    limit === 'composite-yakuman'
  ) {
    return limit;
  }
  return undefined;
}

function adjustFuForDoubleWindPair(input: ScoreInput, data: NonNullable<RiichiCalcResult['data']>): {
  fu: number;
  fuReal: number;
  warnings: string[];
} {
  const hasDoubleWindPair = data.fu.fuDetails.some((detail) => detail.name.includes('连风'));
  if (!input.doubleWindPairTwoFu || !hasDoubleWindPair) {
    return { fu: data.fu.fu, fuReal: data.fu.fuReal, warnings: [] };
  }

  const fuReal = Math.max(20, data.fu.fuReal - 2);
  return {
    fuReal,
    fu: Math.ceil(fuReal / 10) * 10,
    warnings: ['连风牌雀头按 2 符规则修正'],
  };
}

function doraName(type: string): string {
  if (type === 'UraDora') return '里宝牌';
  if (type === 'RedDora') return '赤宝牌';
  return '宝牌';
}

function mapYaku(data: NonNullable<RiichiCalcResult['data']>, input: ScoreInput): YakuResultItem[] {
  const handYaku = data.yaku.map<YakuResultItem>((yaku) => ({
    id: yaku.code,
    name: yaku.name,
    han: yaku.isDoubleYakuman ? 'double-yakuman' : yaku.isYakuman ? 'yakuman' : yaku.han,
    source:
      yaku.code === 'riichi' ||
      yaku.code === 'double-riichi' ||
      yaku.code === 'ippatsu' ||
      yaku.code === 'haitei' ||
      yaku.code === 'houtei' ||
      yaku.code === 'rinshan-kaihou' ||
      yaku.code === 'chankan' ||
      yaku.code === 'tenhou' ||
      yaku.code === 'chiihou'
        ? 'condition'
        : 'hand',
  }));

  const dora = data.dora.map<YakuResultItem>((entry) => ({
    id: entry.type,
    name: doraName(entry.type),
    han: entry.number,
    source: 'dora',
  }));

  if (input.mode === 'sanma' && input.northDoraCount > 0) {
    dora.push({ id: 'north-dora', name: '拔北宝牌', han: input.northDoraCount, source: 'dora' });
  }

  return [...handYaku, ...dora];
}

function buildNoYakuResult(input: ScoreInput, warnings: readonly string[]): ScoreResult {
  return {
    mode: input.mode,
    valid: false,
    yaku: [],
    han: 0,
    warnings: [...warnings, '手牌可以组成和牌形，但没有役，不能计分'],
  };
}

export function calculateScoreOrEfficiency(input: ScoreInput): ScoreComputation {
  const validation = validateScoreInput(input);
  if (!validation.ok) return { kind: 'invalid', errors: validation.errors, warnings: validation.warnings };

  if (input.handTiles.length + input.melds.length * 3 !== 14) {
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

  const riichiResult = riichiCalc(
    {
      closedTiles: input.handTiles.map(toRiichiTile),
      openParts: toOpenParts(input.melds),
    },
    {
      roundWind: toRiichiWind(input.roundWind),
      seatWind: toRiichiWind(input.seatWind),
      doraIndicators: input.doraIndicators.map(toRiichiTile),
      uraDoraIndicators: input.uraDoraIndicators.map(toRiichiTile),
      isDoubleRiichi: input.conditions.doubleRiichi,
      isRiichi: input.conditions.riichi,
      isIppatsu: input.conditions.ippatsu,
      isRinshan: input.conditions.rinshan,
      isTsumo: input.conditions.tsumo,
      isHaiteiHoutei: input.conditions.haiteiOrHoutei,
      isChankan: input.conditions.chankan,
      isTenhou: input.conditions.tenhou,
      isChiihou: input.conditions.chiihou,
      isCompositeYakumanAllowed: false,
      isDoubleYakuman: false,
    },
  );

  if (!riichiResult.isWin) {
    if (riichiResult.message.includes('无役')) return { kind: 'score', result: buildNoYakuResult(input, warnings) };
    return {
      kind: 'efficiency',
      result: calculateHandEfficiency({
        mode: input.mode,
        handTiles: input.handTiles,
        melds: input.melds,
        warnings: [...warnings, riichiResult.message || '未能组成和牌形，显示牌效估算'],
      }),
    };
  }

  if (!riichiResult.data) {
    return { kind: 'invalid', errors: ['riichi-mahjong 未返回和牌明细'], warnings };
  }

  const fu = adjustFuForDoubleWindPair(input, riichiResult.data);
  warnings.push(...fu.warnings);

  const extraNorthDora = input.mode === 'sanma' ? input.northDoraCount : 0;
  const han = riichiResult.data.han + extraNorthDora;
  const point = applySanmaTsumoLoss(calculatePoint({
    han,
    fu: fu.fu,
    isDealer: isDealer(input),
    winMethod: getWinMethod(input),
    honba: input.honba,
  }), input);

  return {
    kind: 'score',
    result: {
      mode: input.mode,
      valid: true,
      yaku: mapYaku(riichiResult.data, input),
      han,
      fu: fu.fu,
      fuReal: fu.fuReal,
      fuBreakdown: riichiResult.data.fu.fuDetails.map((detail) => ({ name: detail.name, fu: detail.fu })),
      limit: point.limit ?? mapRiichiLimit(riichiResult.data.score.hanLimit),
      limitLabel: point.limitLabel ?? undefined,
      payments: point.payments,
      warnings,
    },
  };
}
