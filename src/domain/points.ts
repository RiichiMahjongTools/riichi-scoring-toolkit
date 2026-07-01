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

export interface PointQuery {
  han: number;
  fu: number;
  isDealer: boolean;
  winMethod: WinMethod;
  honba?: number;
}

export interface PointResult {
  han: number;
  fu: number;
  isDealer: boolean;
  winMethod: WinMethod;
  basePoints: number;
  limit: LimitClass | null;
  limitLabel: string | null;
  payments: {
    ron?: number;
    tsumoAllPays?: number;
    tsumoDealerPays?: number;
    tsumoNonDealerPays?: number;
    totalGain: number;
  };
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
  limit: LimitClass | null;
  limitLabel: string | null;
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

function ceil100(value: number): number {
  return Math.ceil(value / 100) * 100;
}

export function getLimitClass(han: number, fu: number): { limit: LimitClass | null; basePoints: number } {
  if (han >= 26) {
    const yakumanCount = Math.floor(han / 13);
    return {
      limit: yakumanCount > 2 ? 'composite-yakuman' : yakumanCount === 2 ? 'double-yakuman' : 'yakuman',
      basePoints: 8000 * Math.max(1, yakumanCount),
    };
  }
  if (han >= 13) return { limit: 'yakuman', basePoints: 8000 };
  if (han >= 11) return { limit: 'sanbaiman', basePoints: 6000 };
  if (han >= 8) return { limit: 'baiman', basePoints: 4000 };
  if (han >= 6) return { limit: 'haneman', basePoints: 3000 };
  if (han === 5 || (han === 4 && fu >= 40) || (han === 3 && fu >= 70)) {
    return { limit: 'mangan', basePoints: 2000 };
  }

  const rawBasePoints = fu * 2 ** (han + 2);
  if (rawBasePoints >= 2000) return { limit: 'mangan', basePoints: 2000 };
  return { limit: null, basePoints: rawBasePoints };
}

export function limitLabel(limit: LimitClass | null): string | null {
  return limit ? LIMIT_LABELS[limit] : null;
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

export function calculatePoint(query: PointQuery): PointResult {
  const honba = Math.max(0, Math.trunc(query.honba ?? 0));
  const { limit, basePoints } = getLimitClass(query.han, query.fu);

  if (query.winMethod === 'ron') {
    const ron = ceil100(basePoints * (query.isDealer ? 6 : 4)) + honba * 300;
    return {
      han: query.han,
      fu: query.fu,
      isDealer: query.isDealer,
      winMethod: query.winMethod,
      basePoints,
      limit,
      limitLabel: limitLabel(limit),
      payments: { ron, totalGain: ron },
    };
  }

  if (query.isDealer) {
    const tsumoAllPays = ceil100(basePoints * 2) + honba * 100;
    return {
      han: query.han,
      fu: query.fu,
      isDealer: query.isDealer,
      winMethod: query.winMethod,
      basePoints,
      limit,
      limitLabel: limitLabel(limit),
      payments: {
        tsumoAllPays,
        totalGain: tsumoAllPays * 3,
      },
    };
  }

  const tsumoDealerPays = ceil100(basePoints * 2) + honba * 100;
  const tsumoNonDealerPays = ceil100(basePoints) + honba * 100;
  return {
    han: query.han,
    fu: query.fu,
    isDealer: query.isDealer,
    winMethod: query.winMethod,
    basePoints,
    limit,
    limitLabel: limitLabel(limit),
    payments: {
      tsumoDealerPays,
      tsumoNonDealerPays,
      totalGain: tsumoDealerPays + tsumoNonDealerPays * 2,
    },
  };
}

export function buildHanFuTableRow(han: HanValue, fu: FuValue): HanFuTableRow {
  const legal = isLegalHanFu(han, fu);
  const dealerRon = calculatePoint({ han, fu, isDealer: true, winMethod: 'ron' });
  const dealerTsumo = calculatePoint({ han, fu, isDealer: true, winMethod: 'tsumo' });
  const nonDealerRon = calculatePoint({ han, fu, isDealer: false, winMethod: 'ron' });
  const nonDealerTsumo = calculatePoint({ han, fu, isDealer: false, winMethod: 'tsumo' });

  return {
    han,
    fu,
    legal,
    note: legal ? undefined : '通常不成立的番符组合',
    dealer: {
      ron: dealerRon.payments.ron ?? 0,
      tsumo: dealerTsumo.payments.tsumoAllPays ?? 0,
    },
    nonDealer: {
      ron: nonDealerRon.payments.ron ?? 0,
      tsumoDealerPays: nonDealerTsumo.payments.tsumoDealerPays ?? 0,
      tsumoNonDealerPays: nonDealerTsumo.payments.tsumoNonDealerPays ?? 0,
    },
    limit: dealerRon.limit,
    limitLabel: dealerRon.limitLabel,
  };
}

export function buildHanFuTable(hanValues: readonly HanValue[] = STANDARD_HAN_VALUES): HanFuTableRow[] {
  return hanValues.flatMap((han) => STANDARD_FU_VALUES.map((fu) => buildHanFuTableRow(han, fu)));
}

export function formatTsumoSplit(result: PointResult): string {
  if (result.winMethod !== 'tsumo') return '';
  if (result.isDealer) return `${result.payments.tsumoAllPays ?? 0} all`;
  return `${result.payments.tsumoNonDealerPays ?? 0}/${result.payments.tsumoDealerPays ?? 0}`;
}
