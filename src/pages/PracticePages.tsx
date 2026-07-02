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
  getLegalRonFuOptions,
  type FuValue,
  type PracticeFeedback,
} from '../domain';
import { WIND_LABELS, formatComebackAnswer, formatPoints, formatWinMethod } from './shared';

const RANK_LABELS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const COMEBACK_OPTION_ROWS: Array<Array<FuValue | 'impossible'>> = [
  [20, 25, 30, 40, 50, 60],
  [70, 80, 90, 100, 110, 'impossible'],
];

function shortComebackAnswer(value: FuValue | 'impossible' | undefined): string {
  if (!value) return '-';
  if (value === 'impossible') return '不可';
  return String(value);
}

function isComebackOptionAvailable(han: number, option: FuValue | 'impossible'): boolean {
  if (option === 'impossible') return true;
  return getLegalRonFuOptions(han).includes(option);
}

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

  const correctAnswerTiles = (feedback?.correctAnswer ?? question.correctWaits).map((rank) => `${question.suit}${rank}`);
  const userAnswerTiles = (feedback?.userAnswer ?? selectedRanks).map((rank) => `${question.suit}${rank}`);

  return (
    <div className="mj-page-stack mj-practice-design mj-chinitsu-page">
      <PracticeStats
        items={[
          { label: '题号', value: `第${seed + 1}题` },
          { label: '状态', value: `连对 ${streak}`, tone: streak > 0 ? 'green' : 'default' },
          { label: '花色', value: `${RANK_LABELS[0]}-${RANK_LABELS[8]}${question.suit === 'm' ? '万' : question.suit === 'p' ? '筒' : '索'}` },
        ]}
      />

      <SectionCard className="mj-practice-hand-card mj-chinitsu-hand-card" title="清一色手牌">
        <TileStrip tileSize="sm" tiles={question.handTiles.map((tile) => tile.code)} />
      </SectionCard>

      {feedback ? (
        <section className={feedback.correct ? 'mj-practice-result-compact mj-practice-result-compact--success mj-chinitsu-result-card' : 'mj-practice-result-compact mj-practice-result-compact--danger mj-chinitsu-result-card'}>
          <h2>{feedback.correct ? '本题连对 +1' : '本题需要复盘'}</h2>
          <div className="mj-chinitsu-feedback-list">
            <div className="mj-chinitsu-feedback-row">
              <span>正确答案</span>
              <div className="mj-chinitsu-feedback-tiles">
                {correctAnswerTiles.map((tile) => (
                  <MahjongTile key={tile} code={tile} size="sm" />
                ))}
              </div>
            </div>
            <div className="mj-chinitsu-feedback-row">
              <span>你的答案</span>
              <div className="mj-chinitsu-feedback-tiles">
                {userAnswerTiles.length > 0 ? userAnswerTiles.map((tile) => (
                  <MahjongTile key={tile} code={tile} size="sm" />
                )) : <small>未选择</small>}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <SectionCard title="选择全部听牌 / 有效和牌">
        <div className="mj-chinitsu-answer-grid">
          {question.candidateRanks.map((rank) => {
            const selected = selectedRanks.includes(rank);
            const isCorrect = Boolean(feedback?.correctAnswer.includes(rank));
            const isWrong = Boolean(feedback && selected && !isCorrect);
            const tileCode = `${question.suit}${rank}`;
            return (
              <button
                key={rank}
                aria-pressed={selected}
                aria-label={`选择${rank}${question.suit === 'm' ? '万' : question.suit === 'p' ? '筒' : '索'}`}
                className={[
                  'mj-wait-tile-choice',
                  selected && 'mj-wait-tile-choice--selected',
                  feedback && isCorrect && 'mj-wait-tile-choice--correct',
                  isWrong && 'mj-wait-tile-choice--wrong',
                ]
                  .filter(Boolean)
                  .join(' ')}
                type="button"
                onClick={() => toggleRank(rank)}
              >
                <MahjongTile aria-hidden="true" code={tileCode} selected={isCorrect || (selected && !feedback)} size="lg" />
              </button>
            );
          })}
        </div>
      </SectionCard>

      {feedback ? (
        <ActionButton fullWidth icon={<Sparkles aria-hidden="true" />} onClick={() => nextPracticeSeed(setSeed, () => {
          setSelectedRanks([]);
          setFeedback(null);
        })}>
          下一题
        </ActionButton>
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

  const nextQuestion = () => nextPracticeSeed(setSeed, () => {
    setAnswers({});
    setFeedback(null);
  });

  const selectAnswer = (han: number, option: FuValue | 'impossible') => {
    setFeedback(null);
    setAnswers((value) => ({ ...value, [han]: option }));
  };

  return (
    <div className="mj-page-stack mj-practice-design mj-comeback-practice-page">
      <section className="mj-comeback-sheet">
        <header className="mj-comeback-sheet__header">
          <h2>作答</h2>
          <span>{streak}连正</span>
        </header>

        <div className="mj-comeback-sheet__body">
          <p className="mj-comeback-question">
            您的自风是<strong>{WIND_LABELS[question.userSeatWind]}</strong>，
            距离逆转需要<strong>{question.pointGap.toLocaleString('zh-CN')}点</strong>，
            对手自风为<strong>{WIND_LABELS[question.targetSeatWind]}</strong>。
            请判断下列番数中最低需要多少符<strong>荣和</strong>。
          </p>

          <div className="mj-comeback-board-list" aria-label="逆转所需番符作答">
          {question.hanTiers.map((han) => {
            const selected = answers[han];
            const standard = feedback?.correctAnswer[han] ?? question.answers[han];
            const isWrong = Boolean(feedback && selected !== standard);
            const isCorrect = Boolean(feedback && selected === standard);
            return (
              <div key={han} className="mj-comeback-board">
                <span
                  className={[
                    'mj-comeback-board__answer',
                    selected === 'impossible' && 'mj-comeback-board__answer--impossible',
                    isWrong && 'mj-comeback-board__answer--wrong',
                    isCorrect && 'mj-comeback-board__answer--correct',
                  ].filter(Boolean).join(' ')}
                >
                  <strong>{shortComebackAnswer(selected)}</strong>
                  <small>{feedback ? `标准 ${formatComebackAnswer(standard)}` : `${han}番符数`}</small>
                </span>
                {COMEBACK_OPTION_ROWS.flatMap((row) =>
                  row.map((option) => {
                    const disabled = !isComebackOptionAvailable(han, option);
                    const selectedCell = selected === option;
                    const correctCell = feedback && standard === option;
                    const wrongCell = feedback && selectedCell && selected !== standard;
                    return (
                      <button
                        key={`${han}-${option}`}
                        aria-pressed={selectedCell}
                        className={[
                          'mj-comeback-fu-cell',
                          selectedCell && 'mj-comeback-fu-cell--selected',
                          correctCell && 'mj-comeback-fu-cell--correct',
                          wrongCell && 'mj-comeback-fu-cell--wrong',
                          option === 'impossible' && 'mj-comeback-fu-cell--impossible',
                        ].filter(Boolean).join(' ')}
                        disabled={disabled}
                        type="button"
                        onClick={() => selectAnswer(han, option)}
                      >
                        {shortComebackAnswer(option)}
                      </button>
                    );
                  }),
                )}
              </div>
            );
          })}
          </div>
        </div>

        {feedback ? (
          <div className="mj-comeback-feedback">
            <Alert icon={<AlertCircle aria-hidden="true" />} tone={feedback.correct ? 'success' : 'warning'} title="判定结果">
              {feedback.correct ? `全部正确，当前连对 ${streak}` : feedback.breakdown.join('；')}
            </Alert>
            <ActionButton fullWidth icon={<Sparkles aria-hidden="true" />} variant="secondary" onClick={nextQuestion}>
              下一题
            </ActionButton>
          </div>
        ) : null}

        <footer className="mj-comeback-sheet__footer">
          <ActionButton disabled={!isComplete} fullWidth icon={<Check aria-hidden="true" />} onClick={submit}>
            确认答案
          </ActionButton>
          <ActionButton fullWidth icon={<Calculator aria-hidden="true" />} variant="ghost" onClick={() => {
            window.location.hash = '#/han-fu-calculator';
          }}>
            查看番符点数计算器
          </ActionButton>
        </footer>
      </section>
    </div>
  );
}
