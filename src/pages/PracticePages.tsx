import { AlertCircle, BookOpen, Calculator, Check, Eye, X } from 'lucide-react';

import {
  ActionButton,
  Alert,
  Chip,
  DataTable,
  MahjongTile,
  SectionCard,
  TileStrip,
} from '../components';

const fuQuestionHand = ['m2', 'm3', 'm4', 'p5', 'p5', 'p8', 'p8', 'p8', 's6', 's7', 's8', 'z3', 'z3', 'z7'];
const chinitsuHand = ['m1', 'm2', 'm3', 'm3', 'm4', 'm5', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9'];
const chinitsuAnswerTiles = ['m2', 'm5', 'm8'];

function PracticeStats({
  items,
}: {
  items: Array<{ label: string; value: string; tone?: 'default' | 'green' | 'gold' }>;
}) {
  return (
    <div className="mj-practice-stat-grid">
      {items.map((item) => (
        <span key={item.label} className={item.tone ? `mj-practice-stat-card mj-practice-stat-card--${item.tone}` : 'mj-practice-stat-card'}>
          <small>{item.label}</small>
          <strong>{item.value}</strong>
        </span>
      ))}
    </div>
  );
}

export function ChinitsuPracticePage() {
  return (
    <div className="mj-page-stack mj-practice-design mj-chinitsu-page">
      <SectionCard title="清一色手牌">
        <TileStrip tileSize="sm" tiles={chinitsuHand} />
      </SectionCard>

      <SectionCard title="选择全部听牌 / 有效和牌">
        <div className="mj-chinitsu-answer-grid">
          {['一', '二', '三', '四', '五', '六', '七', '八', '九'].map((label, index) => {
            const rank = index + 1;
            const selected = [2, 4, 5, 8].includes(rank);
            return (
              <button
                key={label}
                aria-pressed={selected}
                className={[
                  'mj-rank-choice',
                  selected && 'mj-rank-choice--selected',
                  rank === 4 && 'mj-rank-choice--wrong',
                ]
                  .filter(Boolean)
                  .join(' ')}
                type="button"
              >
                {label}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <section className="mj-practice-result-compact mj-practice-result-compact--success">
        <h2>本题连对 +1</h2>
        <div className="mj-result-tile-row">
          {chinitsuAnswerTiles.map((tile) => (
            <MahjongTile key={tile} code={tile} size="lg" />
          ))}
        </div>
        <p>正确答案：二五八万 · 你的选择：二四五八万</p>
      </section>
    </div>
  );
}

export function FuPracticePage() {
  const rows = [
    { id: 'base', item: '副底', fu: '20' },
    { id: 'menzen', item: '门清荣和', fu: '10' },
    { id: 'pair', item: '雀头：役牌中', fu: '2' },
    { id: 'wait', item: '边张听牌', fu: '2' },
    { id: 'round', item: '向上取整', fu: '40' },
  ];

  return (
    <div className="mj-page-stack mj-practice-design mj-fu-practice-page">
      <PracticeStats
        items={[
          { label: '题号', value: '第12题' },
          { label: '状态', value: '连对 5', tone: 'green' },
          { label: '场况', value: '东场南家' },
        ]}
      />

      <SectionCard className="mj-practice-hand-card" title="题面手牌">
        <TileStrip highlightLast tileSize="sm" tiles={fuQuestionHand} />
        <div className="mj-practice-hand-meta">
          <Chip selected>荣和</Chip>
          <Chip selected>场风东</Chip>
          <Chip selected>自风南</Chip>
          <Chip selected>边张听牌</Chip>
        </div>
      </SectionCard>

      <SectionCard title="选择最终符数">
        <div className="mj-fu-answer-grid">
          {[
            { label: '20符' },
            { label: '25符' },
            { label: '30符', tone: 'wrong' },
            { label: '40符', tone: 'correct' },
            { label: '50符' },
            { label: '60符' },
          ].map((option) => (
            <button
              key={option.label}
              aria-pressed={Boolean(option.tone)}
              className={[
                'mj-fu-choice',
                option.tone === 'wrong' && 'mj-fu-choice--wrong',
                option.tone === 'correct' && 'mj-fu-choice--correct',
              ]
                .filter(Boolean)
                .join(' ')}
              type="button"
            >
              {option.tone === 'wrong' ? <X aria-hidden="true" /> : null}
              {option.tone === 'correct' ? <Check aria-hidden="true" /> : null}
              {option.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <section className="mj-fu-breakdown-panel">
        <h2>
          <X aria-hidden="true" />
          回答错误 · 标准答案 40 符
        </h2>
        <DataTable
          columns={[
            { id: 'item', header: '项目' },
            { id: 'fu', header: '符', align: 'center' },
          ]}
          rows={rows}
          rowKey={(row) => String(row.id)}
        />
        <ActionButton fullWidth icon={<BookOpen aria-hidden="true" />} variant="ghost">
          查看符数帮助
        </ActionButton>
      </section>
    </div>
  );
}

export function PointPracticePage() {
  const rows = [
    { id: '3-30', label: '3番30符', ron: '3900', tsumo: '1000/2000' },
    { id: '3-40', label: '3番40符', ron: '5200', tsumo: '1300/2600' },
    { id: '4-30', label: '4番30符', ron: '7700', tsumo: '2000/3900' },
  ];

  return (
    <div className="mj-page-stack mj-practice-design mj-point-practice-page">
      <SectionCard title="题目" description="根据番符、亲闲与和牌方式填写总获得点数。">
        <div className="mj-practice-hand-meta">
          <Chip selected>3番40符</Chip>
          <Chip selected>闲家</Chip>
          <Chip selected>荣和</Chip>
          <Chip selected>役：立直+三色</Chip>
        </div>
      </SectionCard>

      <SectionCard title="输入总获得点数">
        <div className="mj-point-digit-grid" aria-label="输入总获得点数">
          {['7', '7', '0', '0'].map((digit, index) => (
            <span key={`${digit}-${index}`} className="mj-point-digit-box">
              {digit}
            </span>
          ))}
        </div>
      </SectionCard>

      <Alert icon={<AlertCircle aria-hidden="true" />} tone="danger" title="无役题答案">
        若题目没有役，正确答案为 0。
      </Alert>

      <SectionCard className="mj-practice-lookup-card" title="番符点数表">
        <div className="mj-practice-lookup-toggle">
          <ActionButton icon={<Eye aria-hidden="true" />} size="sm" variant="ghost">
            显示 / 隐藏查询表
          </ActionButton>
        </div>
        <DataTable
          columns={[
            { id: 'label', header: '番符' },
            { id: 'ron', header: '荣和' },
            { id: 'tsumo', header: '自摸' },
          ]}
          rows={rows}
          rowKey={(row) => String(row.id)}
        />
      </SectionCard>

      <section className="mj-practice-result-compact mj-practice-result-compact--success">
        <h2>
          <Check aria-hidden="true" />
          回答正确：7700 点
        </h2>
        <ActionButton fullWidth icon={<BookOpen aria-hidden="true" />}>
          查看点数帮助
        </ActionButton>
      </section>
    </div>
  );
}

export function ComebackPracticePage() {
  return (
    <div className="mj-page-stack mj-practice-design mj-comeback-practice-page">
      <section className="mj-comeback-hero">
        <span>荣和所需点差</span>
        <strong>5,200</strong>
        <p>南三局 · 闲家追分 · 不计供托</p>
      </section>

      <SectionCard title="判断 1 到 4 番最低需要多少符">
        <div className="mj-comeback-answer-list">
          {[
            ['1番', '你的不可', '标准 不可', 'correct'],
            ['2番', '你的70符', '标准 80符', 'wrong'],
            ['3番', '你的40符', '标准 40符', 'correct'],
            ['4番', '你的30符', '标准 30符', 'correct'],
          ].map(([han, yours, standard, tone]) => (
            <div key={han} className="mj-comeback-answer-row">
              <strong>{han}</strong>
              <span className={tone === 'wrong' ? 'mj-answer-pill mj-answer-pill--wrong' : 'mj-answer-pill'}>
                {yours}
              </span>
              <span className="mj-answer-pill mj-answer-pill--plain">{standard}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <Alert icon={<AlertCircle aria-hidden="true" />} tone="warning" title="连对数">
        答对 3 / 4，当前连对 7。
      </Alert>

      <ActionButton fullWidth icon={<Calculator aria-hidden="true" />}>
        跳转番符点数计算
      </ActionButton>
    </div>
  );
}
