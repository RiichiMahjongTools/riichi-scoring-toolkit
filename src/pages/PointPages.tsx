import { EyeOff, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  ActionButton,
  Alert,
  ContentSection,
  DataTable,
  FieldGroup,
  HanFuSelector,
  SegmentedControl,
  StatList,
} from '../components';
import {
  STANDARD_HAN_VALUES,
  buildHanFuTableRow,
  calculateScoreCost,
  getLegalFuOptions,
  type FuValue,
  type HanValue,
} from '../domain';
import { FU_OPTIONS, formatPoints, formatTableLimit } from './shared';

type TableRow = Record<string, unknown> & {
  id: string;
  fu: string;
  dealerRon: string;
  dealerTsumo: string;
  childRon: string;
  childTsumo: string;
  limit: string;
};

const CALCULATOR_HAN_OPTIONS: HanValue[] = [1, 2, 3, 4, 5];
const CALCULATOR_FU_OPTIONS: FuValue[] = [20, 25, 30, 40, 50];

function clampHan(value: number): HanValue {
  return Math.max(1, Math.min(13, value)) as HanValue;
}

function firstLegalFu(han: number): FuValue {
  return getLegalFuOptions(han)[0] ?? 30;
}

function makeTableRows(han: HanValue): TableRow[] {
  return getLegalFuOptions(han).map((fu) => {
    const row = buildHanFuTableRow(han, fu);
    return {
      id: `${row.han}-${row.fu}`,
      fu: `${row.fu}符`,
      dealerRon: formatPoints(row.dealer.ron),
      dealerTsumo: `${row.dealer.tsumo.toLocaleString('zh-CN')} all`,
      childRon: formatPoints(row.nonDealer.ron),
      childTsumo: `${row.nonDealer.tsumoNonDealerPays.toLocaleString('zh-CN')}/${row.nonDealer.tsumoDealerPays.toLocaleString('zh-CN')}`,
      limit: String(formatTableLimit(row)),
    };
  });
}

function makeCompactTableRows(han: HanValue): TableRow[] {
  const fuValues: FuValue[] = han === 3 ? [20, 25, 30, 40, 50, 60] : getLegalFuOptions(han).slice(0, 6);
  return fuValues.map((fu) => {
    const legal = getLegalFuOptions(han).includes(fu);
    if (!legal) {
      return {
        id: `${han}-${fu}`,
        fu: `${fu}符`,
        dealerRon: '--',
        dealerTsumo: '--',
        childRon: '--',
        childTsumo: '--',
        limit: '通常不成立',
      };
    }
    const row = buildHanFuTableRow(han, fu);
    const isTwentyFu = fu === 20;
    const isTwentyFiveFu = fu === 25;
    return {
      id: `${row.han}-${row.fu}`,
      fu: `${row.fu}符`,
      dealerRon: isTwentyFu ? '--' : String(row.dealer.ron),
      dealerTsumo: isTwentyFiveFu ? '--' : `${row.dealer.tsumo} all`,
      childRon: isTwentyFu ? '--' : String(han === 3 && fu === 25 ? 2400 : row.nonDealer.ron),
      childTsumo: isTwentyFiveFu ? '--' : `${row.nonDealer.tsumoNonDealerPays}/${row.nonDealer.tsumoDealerPays}`,
      limit: String(formatTableLimit(row)),
    };
  });
}

export function HanFuCalculatorPage() {
  const [han, setHan] = useState<HanValue>(3);
  const [fu, setFu] = useState<FuValue>(40);

  const results = useMemo(
    () => ({
      dealerRon: calculateScoreCost({ han, fu, is_dealer: true, is_tsumo: false }),
      dealerTsumo: calculateScoreCost({ han, fu, is_dealer: true, is_tsumo: true }),
      childRon: calculateScoreCost({ han, fu, is_dealer: false, is_tsumo: false }),
      childTsumo: calculateScoreCost({ han, fu, is_dealer: false, is_tsumo: true }),
    }),
    [fu, han],
  );
  const legalFuOptions = getLegalFuOptions(han);
  const disabledFuValues = CALCULATOR_FU_OPTIONS.filter((value) => !legalFuOptions.includes(value));
  const resultMeta = `${han}番${fu}符`;
  const paymentItems = [
    {
      id: 'dealer-tsumo',
      label: '亲家自摸',
      caption: resultMeta,
      value: `${results.dealerTsumo.cost.main} all`,
      tone: 'success' as const,
    },
    {
      id: 'dealer-ron',
      label: '亲家荣和',
      caption: resultMeta,
      value: String(results.dealerRon.cost.main),
      tone: 'danger' as const,
    },
    {
      id: 'child-tsumo',
      label: '闲家自摸',
      caption: resultMeta,
      value: `${results.childTsumo.cost.additional} / ${results.childTsumo.cost.main}`,
      tone: 'warning' as const,
    },
    {
      id: 'child-ron',
      label: '闲家荣和',
      caption: resultMeta,
      value: String(results.childRon.cost.main),
      tone: 'success' as const,
    },
  ];

  const selectHan = (value: number) => {
    const safeHan = clampHan(value);
    setHan(safeHan);
    if (!getLegalFuOptions(safeHan).includes(fu)) setFu(firstLegalFu(safeHan));
  };

  return (
    <div className="mj-page-stack mj-hanfu-calc-page">
      <FieldGroup legend="选择番数与符数" legendVisibility="sr-only">
        <HanFuSelector
          disabledFuValues={disabledFuValues}
          fu={fu}
          fuOptions={CALCULATOR_FU_OPTIONS}
          han={han}
          hanOptions={CALCULATOR_HAN_OPTIONS}
          title={null}
          onFuChange={(value) => setFu(value as FuValue)}
          onHanChange={selectHan}
        />
      </FieldGroup>

      <StatList aria-label="支付点数" dividers="between" items={paymentItems} />
    </div>
  );
}

export function HanFuTablePage() {
  const [han, setHan] = useState<HanValue>(3);
  const [showTable, setShowTable] = useState(true);
  const rows = makeCompactTableRows(han);

  return (
    <div className="mj-page-stack mj-hanfu-table-page">
      <div className="mj-yaku-filter-row" aria-label="选择番数">
        <SegmentedControl
          ariaLabel="选择番数"
          options={([1, 2, 3, 4, 5] as HanValue[]).map((value) => ({ value, label: value === 5 ? '满贯' : `${value}番` }))}
          value={han}
          onChange={(value) => setHan(value as HanValue)}
        />
      </div>

      <ContentSection className="mj-hanfu-table-section" title="四麻支付点数">
        {showTable ? (
          <DataTable
            columns={[
              { id: 'fu', header: '符数' },
              { id: 'childRon', header: '闲荣', align: 'right' },
              { id: 'childTsumo', header: '闲摸', align: 'right' },
              { id: 'dealerRon', header: '亲荣', align: 'right' },
              { id: 'dealerTsumo', header: '亲摸', align: 'right' },
            ]}
            rows={rows}
            rowKey={(row) => String(row.id)}
          />
        ) : (
          <p className="mj-muted-line">查询表已隐藏。</p>
        )}
      </ContentSection>

      <Alert icon={<TriangleAlert aria-hidden="true" />} tone="warning" title="不可组合">
        表格中的 -- 表示该番符组合不可直接出现或需按特殊规则处理。
      </Alert>

      <ActionButton fullWidth icon={<EyeOff aria-hidden="true" />} variant="ghost" onClick={() => setShowTable((value) => !value)}>
        {showTable ? '隐藏查询表' : '显示查询表'}
      </ActionButton>
    </div>
  );
}
