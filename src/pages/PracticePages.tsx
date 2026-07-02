import { AlertCircle, BookOpen, Calculator, Check, Eye, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  ActionButton,
  Alert,
  Chip,
  DataTable,
  MahjongTile,
  PracticeAnswerPanel,
  SectionCard,
  TileStrip,
} from '../components';
import {
  FU_PRACTICE_OPTIONS,
  buildHanFuTableRow,
  checkChinituWaitAnswer,
  checkComebackPracticeAnswer,
  checkFuPracticeAnswer,
  checkPointPracticeAnswer,
  generateChinituWaitQuestion,
  generateComebackPracticeQuestion,
  generateFuPracticeQuestion,
  generatePointPracticeQuestion,
  type FuValue,
  type PracticeFeedback,
} from '../domain';
import { WIND_LABELS, formatComebackAnswer, formatPoints, formatWinMethod } from './shared';

const RANK_LABELS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const COMEBACK_OPTIONS: Array<FuValue | 'impossible'> = ['impossible', 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];

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

function nextPracticeSeed(
  setSeed: (updater: (value: number) => number) => void,
  reset: () => void,
) {
  reset();
  setSeed((value) => value + 1);
}

function FeedbackBreakdown({ lines }: { lines: readonly string[] }) {
  return (
    <ul className="mj-practice-breakdown-list">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

export function ChinitsuPracticePage() {
  const [seed, setSeed] = useState(0);
  const [selectedRanks, setSelectedRanks] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<PracticeFeedback<number[]> | null>(null);
  const [streak, setStreak] = useState(0);
  const question = useMemo(() => generateChinituWaitQuestion(seed), [seed]);

  const toggleRank = (rank: number) => {
    setFeedback(null);
    setSelectedRanks((value) =>
      value.includes(rank) ? value.filter((current) => current !== rank) : [...value, rank].sort((a, b) => a - b),
    );
  };

  const submit = () => {
    const result = checkChinituWaitAnswer(question, selectedRanks);
    setFeedback(result);
    setStreak((value) => (result.correct ? value + 1 : 0));
  };

  const answerTiles = (feedback?.correctAnswer ?? question.correctWaits).map((rank) => `${question.suit}${rank}`);

  return (
    <div className="mj-page-stack mj-practice-design mj-chinitsu-page">
      <PracticeStats
        items={[
          { label: '题号', value: `第${seed + 1}题` },
          { label: '状态', value: `连对 ${streak}`, tone: streak > 0 ? 'green' : 'default' },
          { label: '花色', value: `${RANK_LABELS[0]}-${RANK_LABELS[8]}${question.suit === 'm' ? '万' : question.suit === 'p' ? '筒' : '索'}` },
        ]}
      />

      <SectionCard title="清一色手牌">
        <TileStrip tileSize="sm" tiles={question.handTiles.map((tile) => tile.code)} />
      </SectionCard>

      <SectionCard title="选择全部听牌 / 有效和牌">
        <div className="mj-chinitsu-answer-grid">
          {question.candidateRanks.map((rank, index) => {
            const selected = selectedRanks.includes(rank);
            const isCorrect = Boolean(feedback?.correctAnswer.includes(rank));
            const isWrong = Boolean(feedback && selected && !isCorrect);
            return (
              <button
                key={rank}
                aria-pressed={selected}
                className={[
                  'mj-rank-choice',
                  selected && 'mj-rank-choice--selected',
                  feedback && isCorrect && 'mj-rank-choice--correct',
                  isWrong && 'mj-rank-choice--wrong',
                ]
                  .filter(Boolean)
                  .join(' ')}
                type="button"
                onClick={() => toggleRank(rank)}
              >
                {RANK_LABELS[index]}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {feedback ? (
        <section className={feedback.correct ? 'mj-practice-result-compact mj-practice-result-compact--success' : 'mj-practice-result-compact mj-practice-result-compact--danger'}>
          <h2>{feedback.correct ? '本题连对 +1' : '本题需要复盘'}</h2>
          <div className="mj-result-tile-row">
            {answerTiles.map((tile) => (
              <MahjongTile key={tile} code={tile} size="lg" />
            ))}
          </div>
          <p>{feedback.breakdown.join(' · ')}</p>
          <ActionButton fullWidth icon={<Sparkles aria-hidden="true" />} onClick={() => nextPracticeSeed(setSeed, () => {
            setSelectedRanks([]);
            setFeedback(null);
          })}>
            下一题
          </ActionButton>
        </section>
      ) : (
        <ActionButton disabled={selectedRanks.length === 0} fullWidth icon={<Check aria-hidden="true" />} onClick={submit}>
          提交答案
        </ActionButton>
      )}
    </div>
  );
}

export function FuPracticePage() {
  const [seed, setSeed] = useState(0);
  const [answerFu, setAnswerFu] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<PracticeFeedback<number> | null>(null);
  const [streak, setStreak] = useState(0);
  const question = useMemo(() => generateFuPracticeQuestion(seed), [seed]);
  const rows = (feedback?.breakdown ?? question.breakdown).map((line, index) => ({
    id: `${index}-${line}`,
    item: line,
    fu: index === (feedback?.breakdown.length ?? question.breakdown.length) - 1 ? `${question.answerFu}` : '',
  }));

  const submit = (fu: number) => {
    const result = checkFuPracticeAnswer(question, fu);
    setAnswerFu(fu);
    setFeedback(result);
    setStreak((value) => (result.correct ? value + 1 : 0));
  };

  return (
    <div className="mj-page-stack mj-practice-design mj-fu-practice-page">
      <PracticeStats
        items={[
          { label: '题号', value: `第${seed + 1}题` },
          { label: '状态', value: `连对 ${streak}`, tone: streak > 0 ? 'green' : 'default' },
          { label: '场况', value: `${WIND_LABELS[question.roundWind]}场${WIND_LABELS[question.seatWind]}家` },
        ]}
      />

      <SectionCard className="mj-practice-hand-card" title="题面手牌">
        <TileStrip highlightLast tileSize="sm" tiles={question.handTiles.map((tile) => tile.code)} />
        <div className="mj-practice-hand-meta">
          <Chip selected>{formatWinMethod(question.winMethod)}</Chip>
          <Chip selected>场风{WIND_LABELS[question.roundWind]}</Chip>
          <Chip selected>自风{WIND_LABELS[question.seatWind]}</Chip>
        </div>
      </SectionCard>

      <SectionCard title="选择最终符数">
        <div className="mj-fu-answer-grid">
          {FU_PRACTICE_OPTIONS.map((fu) => {
            const isSelected = answerFu === fu;
            const isCorrect = Boolean(feedback && fu === feedback.correctAnswer);
            const isWrong = Boolean(feedback && isSelected && !isCorrect);
            return (
              <button
                key={fu}
                aria-pressed={isSelected}
                className={[
                  'mj-fu-choice',
                  isWrong && 'mj-fu-choice--wrong',
                  isCorrect && 'mj-fu-choice--correct',
                ]
                  .filter(Boolean)
                  .join(' ')}
                type="button"
                onClick={() => submit(fu)}
              >
                {isWrong ? <X aria-hidden="true" /> : null}
                {isCorrect ? <Check aria-hidden="true" /> : null}
                {fu}符
              </button>
            );
          })}
        </div>
      </SectionCard>

      {feedback ? (
        <section className="mj-fu-breakdown-panel">
          <h2>
            {feedback.correct ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
            {feedback.correct ? '回答正确' : `回答错误 · 标准答案 ${feedback.correctAnswer} 符`}
          </h2>
          <DataTable
            columns={[
              { id: 'item', header: '拆解' },
              { id: 'fu', header: '答案', align: 'center' },
            ]}
            rows={rows}
            rowKey={(row) => String(row.id)}
          />
          <div className="mj-button-row mj-button-row--two">
            <ActionButton icon={<BookOpen aria-hidden="true" />} variant="ghost" onClick={() => {
              window.location.hash = '#/help-fu';
            }}>
              符数帮助
            </ActionButton>
            <ActionButton icon={<Sparkles aria-hidden="true" />} onClick={() => nextPracticeSeed(setSeed, () => {
              setAnswerFu(null);
              setFeedback(null);
            })}>
              下一题
            </ActionButton>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function makePointLookupRows(han: number) {
  const safeHan = Math.max(1, Math.min(5, han || 1)) as 1 | 2 | 3 | 4 | 5;
  return [30, 40, 50].map((fu) => {
    const row = buildHanFuTableRow(safeHan, fu as FuValue);
    return {
      id: `${safeHan}-${fu}`,
      label: `${safeHan}番${fu}符`,
      ron: String(row.nonDealer.ron),
      tsumo: `${row.nonDealer.tsumoNonDealerPays}/${row.nonDealer.tsumoDealerPays}`,
    };
  });
}

export function PointPracticePage() {
  const [seed, setSeed] = useState(0);
  const [draft, setDraft] = useState('');
  const [feedback, setFeedback] = useState<PracticeFeedback<number> | null>(null);
  const [streak, setStreak] = useState(0);
  const [showLookup, setShowLookup] = useState(true);
  const question = useMemo(() => generatePointPracticeQuestion(seed), [seed]);
  const rows = useMemo(() => makePointLookupRows(question.noYaku ? 1 : question.han), [question.han, question.noYaku]);

  const submit = () => {
    const result = checkPointPracticeAnswer(question, Number(draft || 0));
    setFeedback(result);
    setStreak((value) => (result.correct ? value + 1 : 0));
  };

  return (
    <div className="mj-page-stack mj-practice-design mj-point-practice-page">
      <PracticeStats
        items={[
          { label: '题号', value: `第${seed + 1}题` },
          { label: '状态', value: `连对 ${streak}`, tone: streak > 0 ? 'green' : 'default' },
          { label: '答案口径', value: '总获得点' },
        ]}
      />

      <SectionCard title="题目" description="根据番符、亲闲与和牌方式填写总获得点数。">
        <div className="mj-practice-hand-meta">
          {question.noYaku ? <Chip selected tone="danger">无役</Chip> : <Chip selected>{question.han}番{question.fu}符</Chip>}
          <Chip selected>{question.seatWind === 'east' ? '亲家' : '闲家'}</Chip>
          <Chip selected>{formatWinMethod(question.winMethod)}</Chip>
          <Chip selected>{WIND_LABELS[question.roundWind]}场{WIND_LABELS[question.seatWind]}家</Chip>
        </div>
      </SectionCard>

      <SectionCard title="输入总获得点数">
        <input
          className="mj-point-answer-input"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="例如 7700"
          value={draft}
          onChange={(event) => {
            setFeedback(null);
            setDraft(event.target.value.replace(/\D/g, ''));
          }}
        />
        <ActionButton disabled={!draft} fullWidth icon={<Check aria-hidden="true" />} onClick={submit}>
          提交答案
        </ActionButton>
      </SectionCard>

      {question.noYaku ? (
        <Alert icon={<AlertCircle aria-hidden="true" />} tone="danger" title="无役题答案">
          若题目没有役，正确答案为 0。
        </Alert>
      ) : null}

      <SectionCard className="mj-practice-lookup-card" title="番符点数表">
        <div className="mj-practice-lookup-toggle">
          <ActionButton icon={<Eye aria-hidden="true" />} size="sm" variant="ghost" onClick={() => setShowLookup((value) => !value)}>
            {showLookup ? '隐藏查询表' : '显示查询表'}
          </ActionButton>
        </div>
        {showLookup ? (
          <DataTable
            columns={[
              { id: 'label', header: '番符' },
              { id: 'ron', header: '闲荣' },
              { id: 'tsumo', header: '闲摸' },
            ]}
            rows={rows}
            rowKey={(row) => String(row.id)}
          />
        ) : null}
      </SectionCard>

      {feedback ? (
        <PracticeAnswerPanel
          status={feedback.correct ? 'correct' : 'wrong'}
          title={feedback.correct ? '回答正确' : '本题需要复盘'}
          userAnswer={formatPoints(feedback.userAnswer)}
          correctAnswer={formatPoints(feedback.correctAnswer)}
          streak={streak}
          breakdown={<FeedbackBreakdown lines={feedback.breakdown} />}
          actions={
            <div className="mj-button-row mj-button-row--two">
              <ActionButton icon={<BookOpen aria-hidden="true" />} variant="ghost" onClick={() => {
                window.location.hash = '#/help-points';
              }}>
                点数帮助
              </ActionButton>
              <ActionButton icon={<Sparkles aria-hidden="true" />} onClick={() => nextPracticeSeed(setSeed, () => {
                setDraft('');
                setFeedback(null);
              })}>
                下一题
              </ActionButton>
            </div>
          }
        />
      ) : null}
    </div>
  );
}

export function ComebackPracticePage() {
  const [seed, setSeed] = useState(0);
  const [answers, setAnswers] = useState<Record<number, FuValue | 'impossible'>>({});
  const [feedback, setFeedback] = useState<PracticeFeedback<Record<number, FuValue | 'impossible'>> | null>(null);
  const [streak, setStreak] = useState(0);
  const question = useMemo(() => generateComebackPracticeQuestion(seed), [seed]);
  const isComplete = question.hanTiers.every((han) => answers[han] !== undefined);

  const submit = () => {
    const result = checkComebackPracticeAnswer(question, answers);
    setFeedback(result);
    setStreak((value) => (result.correct ? value + 1 : 0));
  };

  return (
    <div className="mj-page-stack mj-practice-design mj-comeback-practice-page">
      <section className="mj-comeback-hero">
        <span>荣和所需点差</span>
        <strong>{question.pointGap.toLocaleString('zh-CN')}</strong>
        <p>
          {WIND_LABELS[question.userSeatWind]}家追分 · 对手{WIND_LABELS[question.targetSeatWind]}家 · 不计供托
        </p>
      </section>

      <SectionCard title="判断 1 到 4 番最低需要多少符">
        <div className="mj-comeback-answer-list">
          {question.hanTiers.map((han) => {
            const selected = answers[han];
            const standard = feedback?.correctAnswer[han] ?? question.answers[han];
            const wrong = Boolean(feedback && selected !== standard);
            return (
              <div key={han} className="mj-comeback-answer-row mj-comeback-answer-row--interactive">
                <strong>{han}番</strong>
                <span className={wrong ? 'mj-answer-pill mj-answer-pill--wrong' : 'mj-answer-pill'}>
                  你的{formatComebackAnswer(selected)}
                </span>
                {feedback ? <span className="mj-answer-pill mj-answer-pill--plain">标准 {formatComebackAnswer(standard)}</span> : null}
                <div className="mj-chip-row">
                  {COMEBACK_OPTIONS.map((option) => (
                    <Chip
                      key={`${han}-${option}`}
                      selected={selected === option}
                      onClick={() => {
                        setFeedback(null);
                        setAnswers((value) => ({ ...value, [han]: option }));
                      }}
                    >
                      {formatComebackAnswer(option)}
                    </Chip>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {feedback ? (
        <Alert icon={<AlertCircle aria-hidden="true" />} tone={feedback.correct ? 'success' : 'warning'} title="判定结果">
          {feedback.correct ? `全部正确，当前连对 ${streak}` : feedback.breakdown.join('；')}
        </Alert>
      ) : null}

      <div className="mj-button-row mj-button-row--two">
        <ActionButton disabled={!isComplete} icon={<Check aria-hidden="true" />} onClick={submit}>
          提交判断
        </ActionButton>
        <ActionButton icon={<Sparkles aria-hidden="true" />} variant="secondary" onClick={() => nextPracticeSeed(setSeed, () => {
          setAnswers({});
          setFeedback(null);
        })}>
          下一题
        </ActionButton>
      </div>

      <ActionButton fullWidth icon={<Calculator aria-hidden="true" />} variant="ghost" onClick={() => {
        window.location.hash = '#/han-fu-calculator';
      }}>
        跳转番符点数计算
      </ActionButton>
    </div>
  );
}
