import {
  HandConfig,
  OptionalRules,
  ScoresCalculator,
  type ScoresResult,
} from 'mahjong-ts';

export type WinMethod = 'ron' | 'tsumo';
export type LimitClass =
  | 'mangan'
  | 'haneman'
  | 'baiman'
  | 'sanbaiman'
  | 'yakuman'
  | 'double-yakuman'
  | 'composite-yakuman';

export type FuValue = 20 | 25 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100 | 110;
export type HanValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface ScoreCostQuery {
  han: number;
  fu: number;
  is_dealer: boolean;
  is_tsumo: boolean;
  tsumi_number?: number;
  is_three_player?: boolean;
  is_yakuman?: boolean;
}

export interface PointResult {
  han: number;
  fu: number;
  is_dealer: boolean;
  is_tsumo: boolean;
  tsumi_number: number;
  cost: ScoresResult<number>;
  yaku_level: string;
  yaku_level_label: string | null;
  limit: LimitClass | null;
}

export interface HanFuTableRow {
  han: HanValue;
  fu: FuValue;
  legal: boolean;
  note?: string;
  dealer: {
    ron: number;
    tsumo: number;
  };
  nonDealer: {
    ron: number;
    tsumoDealerPays: number;
    tsumoNonDealerPays: number;
  };
  yaku_level: string;
  yaku_level_label: string | null;
  limit: LimitClass | null;
}

export const STANDARD_FU_VALUES: readonly FuValue[] = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];
export const STANDARD_HAN_VALUES: readonly HanValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

const LIMIT_LABELS: Record<LimitClass, string> = {
  mangan: '满贯',
  haneman: '跳满',
  baiman: '倍满',
  sanbaiman: '三倍满',
  yakuman: '役满',
  'double-yakuman': '双倍役满',
  'composite-yakuman': '累计役满',
};

function normalizeYakuLevel(yakuLevel: string): LimitClass | null {
  if (!yakuLevel) return null;
  if (yakuLevel.includes('mangan')) return 'mangan';
  if (yakuLevel === 'haneman') return 'haneman';
  if (yakuLevel === 'baiman') return 'baiman';
  if (yakuLevel === 'sanbaiman') return 'sanbaiman';
  if (yakuLevel === 'yakuman' || yakuLevel === 'kazoe yakuman') return 'yakuman';
  if (yakuLevel === '2x yakuman') return 'double-yakuman';
  if (yakuLevel.endsWith('yakuman')) return 'composite-yakuman';
  return null;
}

export function yakuLevelLabel(limit: LimitClass | null): string | null {
  return limit ? LIMIT_LABELS[limit] : null;
}

function makeScoreConfig(query: ScoreCostQuery): HandConfig {
  return new HandConfig({
    is_tsumo: query.is_tsumo,
    player_wind: query.is_dealer ? 27 : 28,
    tsumi_number: Math.max(0, Math.trunc(query.tsumi_number ?? 0)),
    options: new OptionalRules({
      is_three_player: query.is_three_player ?? false,
    }),
  });
}

export function calculateScoreCost(query: ScoreCostQuery): PointResult {
  const config = makeScoreConfig(query);
  const cost = ScoresCalculator.calculate_scores(
    query.han,
    query.fu,
    config,
    query.is_yakuman ?? false,
  ) as ScoresResult<number>;
  const limit = normalizeYakuLevel(cost.yaku_level);

  return {
    han: query.han,
    fu: query.fu,
    is_dealer: query.is_dealer,
    is_tsumo: query.is_tsumo,
    tsumi_number: config.tsumi_number,
    cost,
    yaku_level: cost.yaku_level,
    yaku_level_label: yakuLevelLabel(limit),
    limit,
  };
}

export function getLimitClass(han: number, fu: number): { limit: LimitClass | null; basePoints: number } {
  const result = calculateScoreCost({ han, fu, is_dealer: false, is_tsumo: false });
  return { limit: result.limit, basePoints: 0 };
}

export function isLegalHanFu(han: number, fu: number): boolean {
  if (!Number.isInteger(han) || han < 1) return false;
  if (!STANDARD_FU_VALUES.includes(fu as FuValue)) return false;
  if (fu === 20) return han >= 2;
  if (fu === 25) return han >= 2;
  return fu >= 30;
}

export function getLegalFuOptions(han: number): FuValue[] {
  return STANDARD_FU_VALUES.filter((fu) => isLegalHanFu(han, fu));
}

export function getLegalRonFuOptions(han: number): FuValue[] {
  return getLegalFuOptions(han).filter((fu) => fu !== 20);
}

export function buildHanFuTableRow(han: HanValue, fu: FuValue): HanFuTableRow {
  const legal = isLegalHanFu(han, fu);
  const dealerRon = calculateScoreCost({ han, fu, is_dealer: true, is_tsumo: false });
  const dealerTsumo = calculateScoreCost({ han, fu, is_dealer: true, is_tsumo: true });
  const nonDealerRon = calculateScoreCost({ han, fu, is_dealer: false, is_tsumo: false });
  const nonDealerTsumo = calculateScoreCost({ han, fu, is_dealer: false, is_tsumo: true });

  return {
    han,
    fu,
    legal,
    note: legal ? undefined : '通常不成立的番符组合',
    dealer: {
      ron: dealerRon.cost.main,
      tsumo: dealerTsumo.cost.main,
    },
    nonDealer: {
      ron: nonDealerRon.cost.main,
      tsumoDealerPays: nonDealerTsumo.cost.main,
      tsumoNonDealerPays: nonDealerTsumo.cost.additional,
    },
    yaku_level: dealerRon.yaku_level,
    yaku_level_label: dealerRon.yaku_level_label,
    limit: dealerRon.limit,
  };
}

export function buildHanFuTable(hanValues: readonly HanValue[] = STANDARD_HAN_VALUES): HanFuTableRow[] {
  return hanValues.flatMap((han) => STANDARD_FU_VALUES.map((fu) => buildHanFuTableRow(han, fu)));
}

export function formatTsumoSplit(result: PointResult): string {
  if (!result.is_tsumo) return '';
  if (result.is_dealer) return `${result.cost.main} all`;
  return `${result.cost.additional}/${result.cost.main}`;
}

export function scoreCostTotal(result: PointResult): number {
  return result.cost.total;
}
