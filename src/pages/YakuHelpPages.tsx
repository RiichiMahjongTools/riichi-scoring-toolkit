import { AlertCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ActionButton, Alert, Chip, DataTable, SectionCard } from '../components';
import { FU_HELP_SECTIONS, POINT_HELP_SECTIONS, YAKU_LIST, type HelpSection, type YakuCategory, type YakuInfo } from '../data';
import type { PageProps } from './shared';
import type { CSSProperties } from 'react';

const CATEGORY_LABELS: Record<YakuCategory | 'all', string> = {
  all: '全部',
  'one-han': '1番',
  'two-han': '2番',
  'three-han': '3番',
  'six-han': '6番',
  yakuman: '役满',
};

type YakuFilter = 'all' | 'closed' | 'open' | 'yakuman';

const FILTERS: Array<{ id: YakuFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'closed', label: '门前' },
  { id: 'open', label: '副露可' },
  { id: 'yakuman', label: '役满' },
];

function formatYakuHan(value: number | 'yakuman' | 'double-yakuman' | undefined) {
  if (value === undefined) return '-';
  if (value === 'yakuman') return '役满';
  if (value === 'double-yakuman') return '双倍役满';
  return `${value}番`;
}

function shortYakuDescription(id: string, fallback: string) {
  const map: Record<string, string> = {
    riichi: '宣言听牌并支付供托',
    'menzen-tsumo': '门前自摸和牌',
    yakuhai: '三元牌、场风或自风刻子',
    chiitoitsu: '七组对子，固定25符',
    chanta: '每组含幺九字牌',
    'sanshoku-doujun': '三门同数字顺子',
    kokushi: '十三种幺九字牌',
    daisangen: '三副三元牌刻子/杠子',
    suuankou: '四组暗刻',
  };
  return map[id] ?? fallback.replace(/[。.]$/, '');
}

function yakuTagText(yaku: YakuInfo) {
  if (typeof yaku.hanClosed === 'number' && typeof yaku.hanOpen === 'number' && yaku.hanClosed !== yaku.hanOpen) {
    return `${yaku.hanClosed}番/${yaku.hanOpen}番`;
  }
  return formatYakuHan(yaku.hanClosed);
}

function yakuOpenText(yaku: YakuInfo) {
  if (yaku.closedOnly) return '门前限定';
  if (typeof yaku.hanClosed === 'number' && typeof yaku.hanOpen === 'number' && yaku.hanClosed !== yaku.hanOpen) {
    return '副露减番';
  }
  return '副露可';
}

export function YakuListPage({ navigate: _navigate }: PageProps) {
  const [filter, setFilter] = useState<YakuFilter>('all');
  const groups = useMemo(() => {
    const filtered = YAKU_LIST.filter((yaku) => {
      if (filter === 'closed') return yaku.closedOnly;
      if (filter === 'open') return !yaku.closedOnly;
      if (filter === 'yakuman') return yaku.category === 'yakuman';
      return true;
    });
    return (['one-han', 'two-han', 'three-han', 'six-han', 'yakuman'] as YakuCategory[])
      .map((category) => ({
        title: CATEGORY_LABELS[category],
        items: filtered.filter((yaku) => yaku.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [filter]);

  const openDetail = (id: string) => {
    window.location.hash = `#/yaku-detail?id=${encodeURIComponent(id)}`;
  };

  return (
    <div className="mj-page-stack mj-yaku-list-page">
      <div className="mj-yaku-filter-row" aria-label="役种筛选">
        {FILTERS.map((option) => (
          <Chip key={option.id} selected={filter === option.id} onClick={() => setFilter(option.id)}>
            {option.label}
          </Chip>
        ))}
      </div>

      {groups.map((group) => (
        <section key={group.title} className="mj-yaku-section-card">
          <h2>{group.title}</h2>
          {group.items.map((yaku) => {
            return (
              <button key={yaku.id} className="mj-yaku-list-row" type="button" onClick={() => openDetail(yaku.id)}>
                <span className="mj-yaku-list-row__copy">
                  <strong>{yaku.name}</strong>
                  <small>{shortYakuDescription(yaku.id, yaku.condition)}</small>
                </span>
                <span className="mj-yaku-tags">
                  <b className={yaku.category === 'yakuman' ? 'mj-yaku-tag mj-yaku-tag--danger' : 'mj-yaku-tag'}>
                    {yakuTagText(yaku)}
                  </b>
                  <b className="mj-yaku-tag mj-yaku-tag--plain">
                    {yakuOpenText(yaku)}
                  </b>
                </span>
                <span className="mj-yaku-arrow" aria-hidden="true">›</span>
              </button>
            );
          })}
        </section>
      ))}
    </div>
  );
}

export function YakuDetailPage() {
  const requestedId = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('id') ?? 'riichi';
  const yaku = YAKU_LIST.find((entry) => entry.id === requestedId);

  if (!yaku) {
    return (
      <div className="mj-page-stack">
        <Alert tone="warning" title="没有找到役种">
          当前资料表为空，请先补充役种数据。
        </Alert>
      </div>
    );
  }

  return (
    <div className="mj-page-stack mj-yaku-detail-page">
      <section className="mj-yaku-detail-hero">
        <h1>{yaku.name}</h1>
        <p>{CATEGORY_LABELS[yaku.category]} · {yakuOpenText(yaku)}</p>
        <div className="mj-chip-row">
          <Chip tone="warning">{formatYakuHan(yaku.hanClosed)}</Chip>
          <Chip tone="danger" selected>{yaku.closedOnly ? '门前限定' : '副露可'}</Chip>
          <Chip>{CATEGORY_LABELS[yaku.category]}</Chip>
        </div>
      </section>

      <SectionCard title="示例">
        <p className="mj-help-example">{yaku.example}</p>
      </SectionCard>

      <SectionCard title="详细说明">
        <div className="mj-detail-block">
          <p>{yaku.condition}</p>
        </div>
        <div className="mj-chip-row">
          {[CATEGORY_LABELS[yaku.category], yakuOpenText(yaku), yakuTagText(yaku)].map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="补充">
        <ul className="mj-yaku-note-list">
          {(yaku.notes?.length ? yaku.notes : ['不同规则集可能有细节差异，实战请以牌桌规则为准。']).map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </SectionCard>

      <ActionButton fullWidth onClick={() => {
        window.location.hash = '#/yaku-list';
      }}>
        ← 返回役种列表
      </ActionButton>
    </div>
  );
}

function HelpTable({ sections }: { sections: readonly HelpSection[] }) {
  const rows: Array<Record<string, unknown> & { id: string; title: string; body: string }> = sections.map((section) => ({
    id: section.id,
    title: section.title,
    body: section.body.join(' '),
  }));

  return (
    <DataTable
      columns={[
        { id: 'title', header: '条目' },
        { id: 'body', header: '说明' },
      ]}
      rows={rows}
      rowKey={(row) => String(row.id)}
    />
  );
}

export function FuHelpPage() {
  return (
    <div className="mj-page-stack mj-rules-help-page">
      <SectionCard title="计算顺序">
        <ol className="mj-check-list">
          <li>1. 先确认固定符：副底、门清荣和、自摸。</li>
          <li>2. 再加雀头、刻子、杠子、听牌形。</li>
          <li>3. 七对子固定25符，平和自摸按规则处理。</li>
          <li>4. 合计后向上取整到10符。</li>
        </ol>
      </SectionCard>

      <HelpDataCard
        title="基础符表"
        columns={['类型', '符数', '说明']}
        rows={[
          ['副底', '20', '所有和牌'],
          ['门清荣和', '10', '门前荣和'],
          ['自摸', '2', '平和例外'],
          ['七对子', '25', '固定不取整'],
        ]}
      />

      <HelpDataCard
        title="雀头与听牌形"
        columns={['项目', '符数', '说明']}
        rows={[
          ['役牌雀头', '2', '三元/场风/自风'],
          ['双风雀头', '4', '部分规则'],
          ['边张', '2', '12听3 / 89听7'],
          ['嵌张', '2', '中间张'],
          ['单骑', '2', '雀头等待'],
        ]}
      />

      <HelpDataCard
        title="刻子 / 杠子"
        columns={['组合', '明刻', '暗刻', '明杠', '暗杠']}
        rows={[
          ['中张', '2', '4', '8', '16'],
          ['幺九字', '4', '8', '16', '32'],
        ]}
      />

      <SectionCard title="典型例题">
        <p className="mj-help-example">门清荣和，役牌雀头，嵌张听牌：20 + 10 + 2 + 2 = 34，向上取整为 40 符。</p>
      </SectionCard>

      <Alert icon={<AlertCircle aria-hidden="true" />} tone="warning" title="包牌 / 责任支付">
        役满责任支付属于点数分配规则，不直接改变符数。
      </Alert>
    </div>
  );
}

export function PointHelpPage() {
  return (
    <div className="mj-page-stack mj-rules-help-page">
      <SectionCard title="点数计算步骤">
        <ol className="mj-check-list">
          <li>1. 先得出番数与符数。</li>
          <li>2. 基本点 = 符 × 2^(番+2)。</li>
          <li>3. 按亲闲与荣和/自摸换算支付。</li>
          <li>4. 满贯以上直接使用固定点数。</li>
        </ol>
      </SectionCard>

      <HelpDataCard
        title="亲闲支付"
        columns={['场景', '支付']}
        rows={[
          ['亲家荣和', '基本点 × 6'],
          ['亲家自摸', '每家 基本点 × 2'],
          ['闲家荣和', '基本点 × 4'],
          ['闲家自摸', '亲 基本点 × 2 / 闲 基本点'],
        ]}
      />

      <HelpDataCard
        title="满贯以上固定点数"
        columns={['级别', '闲家荣和', '亲家荣和']}
        rows={[
          ['满贯', '8000', '12000'],
          ['跳满', '12000', '18000'],
          ['倍满', '16000', '24000'],
          ['三倍满', '24000', '36000'],
          ['役满', '32000', '48000'],
        ]}
      />

      <SectionCard title="典型例题">
        <p className="mj-help-example">闲家荣和 3番40符：基本点 40 × 2^5 = 1280，闲家荣和 ×4 = 5120，向上进位到 5200。</p>
      </SectionCard>
    </div>
  );
}

function HelpDataCard({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  const gridTemplateColumns =
    columns.length === 2
      ? '0.72fr 1.28fr'
      : columns.length === 3
        ? '0.78fr 0.9fr 1.32fr'
        : `repeat(${columns.length}, minmax(0, 1fr))`;

  return (
    <SectionCard className="mj-help-data-card" title={title}>
      <div className="mj-help-table" style={{ gridTemplateColumns } as CSSProperties}>
        {columns.map((column) => (
          <strong key={column}>{column}</strong>
        ))}
        {rows.flatMap((row, rowIndex) =>
          row.map((cell, cellIndex) => (
            <span key={`${rowIndex}-${cellIndex}`} className={rowIndex % 2 === 1 ? 'mj-help-table__alt' : undefined}>
              {cell}
            </span>
          )),
        )}
      </div>
    </SectionCard>
  );
}
