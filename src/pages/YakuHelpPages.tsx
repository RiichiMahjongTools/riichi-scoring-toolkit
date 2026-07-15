import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

import { Alert, Chip, ContentSection, DataTable, MahjongTile } from '../components';
import {
  FU_HELP_SECTIONS,
  POINT_HELP_SECTIONS,
  YAKU_CATEGORY_LABELS,
  YAKU_CATEGORY_ORDER,
  YAKU_LIST,
  type HelpSection,
  type YakuCategory,
} from '../data';
import type { CSSProperties } from 'react';

type YakuFilter = 'all' | YakuCategory;

const FILTERS: readonly { id: YakuFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  ...YAKU_CATEGORY_ORDER.map((category) => ({
    id: category,
    label: YAKU_CATEGORY_LABELS[category],
  })),
];

function yakuNoteTags(note: string) {
  return note
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function yakuCategoryTagClass(category: YakuCategory) {
  return category === 'yakuman' || category === 'double-yakuman'
    ? 'mj-yaku-tag mj-yaku-tag--danger'
    : 'mj-yaku-tag';
}

export function YakuListPage() {
  const [filter, setFilter] = useState<YakuFilter>('all');
  const filtered = YAKU_LIST.filter((yaku) => filter === 'all' || yaku.category === filter);
  const groups = YAKU_CATEGORY_ORDER
    .map((category) => ({
      category,
      title: YAKU_CATEGORY_LABELS[category],
      items: filtered.filter((yaku) => yaku.category === category),
    }))
    .filter((group) => group.items.length > 0);

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
        <section key={group.category} className="mj-yaku-section">
          <h2>{group.title}</h2>
          {group.items.map((yaku) => (
            <article key={yaku.id} className="mj-yaku-list-row">
              <div className="mj-yaku-list-row__heading">
                <h3>{yaku.name}</h3>
                <span className="mj-yaku-tags" aria-label={`${yaku.name}标签`}>
                  <b className={yakuCategoryTagClass(yaku.category)}>{YAKU_CATEGORY_LABELS[yaku.category]}</b>
                  {yakuNoteTags(yaku.note).map((tag) => (
                    <b className="mj-yaku-tag mj-yaku-tag--plain" key={tag}>{tag}</b>
                  ))}
                </span>
              </div>
              <small>{yaku.description}</small>
              {yaku.exampleGroups.length > 0 ? (
                <div className="mj-yaku-example-scroll" aria-label={`${yaku.name}牌例，可横向滚动`} tabIndex={0}>
                  <div aria-label={`${yaku.name}示例牌姿`} className="mj-yaku-example-groups" role="group">
                    {yaku.exampleGroups.map((exampleGroup, groupIndex) => (
                      <span className="mj-yaku-example-group" key={`${yaku.id}-group-${groupIndex}`}>
                        {exampleGroup.map((tile, tileIndex) => (
                          <MahjongTile code={tile} key={`${yaku.id}-${groupIndex}-${tile}-${tileIndex}`} size="sm" />
                        ))}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mj-yaku-example-empty">该流局条件没有固定牌姿示例</p>
              )}
            </article>
          ))}
        </section>
      ))}
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
      <ContentSection title="计算顺序">
        <ol className="mj-check-list">
          <li>1. 先确认固定符：副底、门清荣和、自摸。</li>
          <li>2. 再加雀头、刻子、杠子、听牌形。</li>
          <li>3. 七对子固定25符，平和自摸按规则处理。</li>
          <li>4. 合计后向上取整到10符。</li>
        </ol>
      </ContentSection>

      <HelpDataSection
        title="基础符表"
        columns={['类型', '符数', '说明']}
        rows={[
          ['副底', '20', '所有和牌'],
          ['门清荣和', '10', '门前荣和'],
          ['自摸', '2', '平和例外'],
          ['七对子', '25', '固定不取整'],
        ]}
      />

      <HelpDataSection
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

      <HelpDataSection
        title="刻子 / 杠子"
        columns={['组合', '明刻', '暗刻', '明杠', '暗杠']}
        rows={[
          ['中张', '2', '4', '8', '16'],
          ['幺九字', '4', '8', '16', '32'],
        ]}
      />

      <ContentSection title="典型例题">
        <p className="mj-help-example">门清荣和，役牌雀头，嵌张听牌：20 + 10 + 2 + 2 = 34，向上取整为 40 符。</p>
      </ContentSection>

      <Alert icon={<AlertCircle aria-hidden="true" />} tone="warning" title="包牌 / 责任支付">
        役满责任支付属于点数分配规则，不直接改变符数。
      </Alert>
    </div>
  );
}

export function PointHelpPage() {
  return (
    <div className="mj-page-stack mj-rules-help-page">
      <ContentSection title="点数计算步骤">
        <ol className="mj-check-list">
          <li>1. 先得出番数与符数。</li>
          <li>2. 基本点 = 符 × 2^(番+2)。</li>
          <li>3. 按亲闲与荣和/自摸换算支付。</li>
          <li>4. 满贯以上直接使用固定点数。</li>
        </ol>
      </ContentSection>

      <HelpDataSection
        title="亲闲支付"
        columns={['场景', '支付']}
        rows={[
          ['亲家荣和', '基本点 × 6'],
          ['亲家自摸', '每家 基本点 × 2'],
          ['闲家荣和', '基本点 × 4'],
          ['闲家自摸', '亲 基本点 × 2 / 闲 基本点'],
        ]}
      />

      <HelpDataSection
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

      <ContentSection title="典型例题">
        <p className="mj-help-example">闲家荣和 3番40符：基本点 40 × 2^5 = 1280，闲家荣和 ×4 = 5120，向上进位到 5200。</p>
      </ContentSection>
    </div>
  );
}

function HelpDataSection({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  const gridTemplateColumns =
    columns.length === 2
      ? '0.72fr 1.28fr'
      : columns.length === 3
        ? '0.78fr 0.9fr 1.32fr'
        : `repeat(${columns.length}, minmax(0, 1fr))`;

  return (
    <ContentSection className="mj-help-data-section" title={title}>
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
    </ContentSection>
  );
}
