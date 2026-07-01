import { AlertCircle } from 'lucide-react';

import { ActionButton, Alert, Chip, DataTable, SectionCard, TileStrip } from '../components';
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

const YAKU_GROUPS = [
  { title: '一番役', ids: ['riichi', 'menzen-tsumo', 'yakuhai'] },
  { title: '二番役', ids: ['chiitoitsu', 'chanta', 'sanshoku-doujun'] },
  { title: '役满', ids: ['kokushi', 'daisangen', 'suuankou'] },
];

function formatYakuHan(value: number | 'yakuman' | 'double-yakuman' | undefined) {
  if (value === undefined) return '-';
  if (value === 'yakuman') return '役满';
  if (value === 'double-yakuman') return '双倍役满';
  return `${value}番`;
}

function yakuById(id: string): YakuInfo {
  return YAKU_LIST.find((yaku) => yaku.id === id) ?? YAKU_LIST[0];
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

export function YakuListPage({ navigate }: PageProps) {
  return (
    <div className="mj-page-stack mj-yaku-list-page">
      <div className="mj-yaku-filter-row" aria-label="役种筛选">
        {['常用', '门前', '副露可', '役满'].map((label, index) => (
          <Chip key={label} selected={index === 0}>
            {label}
          </Chip>
        ))}
      </div>

      {YAKU_GROUPS.map((group) => (
        <section key={group.title} className="mj-yaku-section-card">
          <h2>{group.title}</h2>
          {group.ids.map((id) => {
            const yaku = yakuById(id);
            return (
              <button key={id} className="mj-yaku-list-row" type="button" onClick={() => navigate('yaku-detail')}>
                <span className="mj-yaku-list-row__copy">
                  <strong>{yaku.name}</strong>
                  <small>{shortYakuDescription(id, yaku.condition)}</small>
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
  const yaku = YAKU_LIST[0];

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
        <h1>{yaku.name} Riichi</h1>
        <p>别名：リーチ / Reach</p>
        <div className="mj-chip-row">
          <Chip tone="warning">{formatYakuHan(yaku.hanClosed)}</Chip>
          <Chip tone="danger" selected>{yaku.closedOnly ? '门前限定' : '副露可'}</Chip>
          <Chip>基础役</Chip>
        </div>
      </section>

      <SectionCard title="示例牌姿">
        <TileStrip highlightLast tiles={['m2', 'm3', 'm4', 'p2', 'p3', 'p4', 's5', 's6', 's7', 'z1', 'z1', 'z7', 'z7']} />
      </SectionCard>

      <SectionCard title="详细说明">
        <div className="mj-detail-block">
          <p>
            门前状态下听牌后宣告立直，支付1000点供托。宣告后不能随意改变手牌结构，暗杠也受限制。
          </p>
        </div>
        <div className="mj-chip-row">
          {['门前', '听牌', '供托', '一发'].map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="补充">
        <ul className="mj-yaku-note-list">
          <li>立直后若一巡内和牌可叠加一发。</li>
          <li>有里宝牌时仅立直玩家可翻开计算。</li>
          <li>副露后不能立直，暗杠不视为副露。</li>
        </ul>
      </SectionCard>

      <Alert tone="warning" title="找不到对应役种">
        请返回列表重新选择，或检查分享链接中的 id。
      </Alert>

      <ActionButton fullWidth onClick={() => window.history.back()}>
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
