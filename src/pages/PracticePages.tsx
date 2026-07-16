import { AlertCircle, BookOpen, Calculator, Check, Eye, Shuffle, Sparkles, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import {
  ActionButton,
  Alert,
  Chip,
  ContentSection,
  DataTable,
  FieldGroup,
  MahjongTile,
  MeldTileGroup,
  PracticeAnswerPanel,
  SurfacePanel,
  TileStrip,
  type MeldTileGroupKind,
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
  getLegalFuOptions,
  getLegalRonFuOptions,
  tileToCode,
  type FuValue,
  type HanValue,
  type PracticeHandGroup,
  type PracticeFeedback,
} from '../domain';
import { WIND_LABELS, formatComebackAnswer, formatPoints, formatWinMethod } from './shared';

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

const MAX_RECENT_PRACTICE_QUESTIONS = 20;
const MAX_QUESTION_SELECTION_ATTEMPTS = 32;

function browserRandomSeed(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 0x100000000) >>> 0;
}

function useGeneratedPracticeQuestion<TQuestion extends { id: string }>(
  generateQuestion: (seed: number) => TQuestion,
) {
  const [seed, setSeed] = useState(0);
  const recentIds = useRef<string[]>([]);
  const question = useMemo(() => generateQuestion(seed), [generateQuestion, seed]);

  const selectQuestion = (initialSeed: number, retryStep: number) => {
    const blockedIds = [question.id, ...recentIds.current].slice(0, MAX_RECENT_PRACTICE_QUESTIONS);
    let candidateSeed = initialSeed >>> 0;

    for (let attempt = 0; attempt < MAX_QUESTION_SELECTION_ATTEMPTS; attempt += 1) {
      const candidate = generateQuestion(candidateSeed);
      if (!blockedIds.includes(candidate.id)) break;
      candidateSeed = (candidateSeed + retryStep) >>> 0;
    }

    recentIds.current = blockedIds;
    setSeed(candidateSeed);
  };

  return {
    question,
    nextQuestion: () => selectQuestion((seed + 1) >>> 0, 1),
    randomQuestion: () => selectQuestion(browserRandomSeed(), 0x9e3779b9),
  };
}

function RandomQuestionButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="mj-practice-random-action">
      <ActionButton fullWidth icon={<Shuffle aria-hidden="true" />} variant="ghost" onClick={onClick}>
        随机换一题
      </ActionButton>
    </div>
  );
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
  const practice = useGeneratedPracticeQuestion(generateChinituWaitQuestion);
  const [selectedRanks, setSelectedRanks] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<PracticeFeedback<number[]> | null>(null);
  const { question } = practice;

  const toggleRank = (rank: number) => {
    if (feedback) return;
    setSelectedRanks((value) =>
      value.includes(rank) ? value.filter((current) => current !== rank) : [...value, rank].sort((a, b) => a - b),
    );
  };

  const submit = () => {
    if (feedback) return;
    const result = checkChinituWaitAnswer(question, selectedRanks);
    setFeedback(result);
  };

  const resetQuestion = () => {
    setSelectedRanks([]);
    setFeedback(null);
  };

  const nextQuestion = () => {
    resetQuestion();
    practice.nextQuestion();
  };

  const randomQuestion = () => {
    resetQuestion();
    practice.randomQuestion();
  };

  const correctAnswerTiles = (feedback?.correctAnswer ?? question.correctWaits).map((rank) => `${question.suit}${rank}`);
  const userAnswerTiles = (feedback?.userAnswer ?? selectedRanks).map((rank) => `${question.suit}${rank}`);

  return (
    <div className="mj-page-stack mj-practice-design mj-chinitsu-page">
      <ContentSection aria-label="清一色题面手牌" className="mj-practice-hand-section mj-chinitsu-hand-section">
        <TileStrip tileSize="xs" tiles={question.handTiles.map(tileToCode)} />
      </ContentSection>

      {feedback ? (
        <SurfacePanel
          aria-live="polite"
          className={feedback.correct ? 'mj-practice-result-compact mj-practice-result-compact--success mj-chinitsu-result' : 'mj-practice-result-compact mj-practice-result-compact--danger mj-chinitsu-result'}
          role="status"
          title={feedback.correct ? '本题连对 +1' : '本题需要复盘'}
          tone={feedback.correct ? 'success' : 'danger'}
        >
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
        </SurfacePanel>
      ) : null}

      <FieldGroup legend="选择全部听牌 / 有效和牌">
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
                disabled={Boolean(feedback)}
                type="button"
                onClick={() => toggleRank(rank)}
              >
                <MahjongTile aria-hidden="true" code={tileCode} selected={isCorrect || (selected && !feedback)} size="lg" />
              </button>
            );
          })}
        </div>
      </FieldGroup>

      {feedback ? (
        <ActionButton fullWidth icon={<Sparkles aria-hidden="true" />} onClick={nextQuestion}>
          下一题
        </ActionButton>
      ) : (
        <ActionButton disabled={selectedRanks.length === 0} fullWidth icon={<Check aria-hidden="true" />} onClick={submit}>
          提交答案
        </ActionButton>
      )}
      <RandomQuestionButton onClick={randomQuestion} />
    </div>
  );
}

export function FuPracticePage() {
  const practice = useGeneratedPracticeQuestion(generateFuPracticeQuestion);
  const [answerFu, setAnswerFu] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<PracticeFeedback<number> | null>(null);
  const { question } = practice;
  const rows = (feedback?.breakdown ?? question.breakdown).map((line, index) => ({
    id: `${index}-${line}`,
    item: line,
    fu: index === (feedback?.breakdown.length ?? question.breakdown.length) - 1 ? `${question.answerFu}` : '',
  }));

  const submit = (fu: number) => {
    if (feedback) return;
    const result = checkFuPracticeAnswer(question, fu);
    setAnswerFu(fu);
    setFeedback(result);
  };

  const resetQuestion = () => {
    setAnswerFu(null);
    setFeedback(null);
  };

  const nextQuestion = () => {
    resetQuestion();
    practice.nextQuestion();
  };

  const randomQuestion = () => {
    resetQuestion();
    practice.randomQuestion();
  };

  return (
    <div className="mj-page-stack mj-practice-design mj-fu-practice-page">
      <ContentSection aria-label="题面手牌" className="mj-practice-hand-section">
        <PracticeHandScene handGroups={question.handGroups} />
        <div className="mj-practice-hand-meta">
          <Chip selected>{formatWinMethod(question.winMethod)}</Chip>
          <Chip selected>{WIND_LABELS[question.roundWind]}场{WIND_LABELS[question.seatWind]}家</Chip>
          {question.visibleConditions.map((condition) => <Chip key={condition} selected>{condition}</Chip>)}
        </div>
      </ContentSection>

      <FieldGroup legend="选择最终符数">
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
                disabled={Boolean(feedback)}
                type="button"
                onClick={() => submit(fu)}
              >
                {fu}符
              </button>
            );
          })}
        </div>
      </FieldGroup>

      {feedback ? (
        <SurfacePanel
          aria-live="polite"
          className={feedback.correct ? 'mj-fu-breakdown mj-fu-breakdown--correct' : 'mj-fu-breakdown mj-fu-breakdown--wrong'}
          role="status"
          title={
            <>
            {feedback.correct ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
            {feedback.correct ? '回答正确' : `回答错误 · 标准答案 ${feedback.correctAnswer} 符`}
            </>
          }
          tone={feedback.correct ? 'success' : 'danger'}
        >
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
            <ActionButton icon={<Sparkles aria-hidden="true" />} onClick={nextQuestion}>
              下一题
            </ActionButton>
          </div>
        </SurfacePanel>
      ) : null}
      <RandomQuestionButton onClick={randomQuestion} />
    </div>
  );
}

function makePointLookupRows(han: number, isDealer: boolean) {
  const safeHan = Math.max(1, Math.min(13, han || 1)) as HanValue;
  return getLegalFuOptions(safeHan).map((fu) => {
    const row = buildHanFuTableRow(safeHan, fu);
    return {
      id: `${safeHan}-${fu}`,
      label: `${safeHan}番${fu}符`,
      ron: String(isDealer ? row.dealer.ron : row.nonDealer.ron),
      tsumo: isDealer
        ? `${row.dealer.tsumo} 全`
        : `${row.nonDealer.tsumoNonDealerPays}/${row.nonDealer.tsumoDealerPays}`,
    };
  });
}

type PracticeMeldGroup = PracticeHandGroup & { kind: MeldTileGroupKind };

function isMeldPracticeGroup(group: PracticeHandGroup): group is PracticeMeldGroup {
  return group.kind === 'chi' || group.kind === 'pon' || group.kind === 'openKan' || group.kind === 'closedKan';
}

function pointTileOrder(code: string): number {
  const suit = code[0] ?? '';
  const rank = Number(code.slice(1)) || 0;
  const suitOrder: Record<string, number> = { m: 0, p: 1, s: 2, z: 3 };
  return (suitOrder[suit] ?? 9) * 10 + rank;
}

function PracticeHandTile({
  code,
  back = false,
  floatingWinCode,
}: {
  code?: string;
  back?: boolean;
  floatingWinCode?: string;
}) {
  return (
    <span className="mj-point-hand-tile-slot">
      {back ? (
        <span aria-label="牌背" className="mj-tile mj-tile--xs mj-point-hand-tile-back" />
      ) : code ? (
        <MahjongTile code={code} size="xs" />
      ) : null}
      {floatingWinCode ? (
        <span className="mj-point-hand-floating-win" aria-label="和牌">
          <MahjongTile className="mj-point-hand-tile--floating-win" code={floatingWinCode} size="xs" />
        </span>
      ) : null}
    </span>
  );
}

function PracticeHandMeld({
  group,
}: {
  group: PracticeMeldGroup;
}) {
  return (
    <MeldTileGroup
      calledTileIndex={group.calledIndex}
      className="mj-point-hand-meld"
      kind={group.kind}
      size="xs"
      tiles={group.tiles}
    />
  );
}

function PracticeHandScene({ handGroups }: { handGroups: readonly PracticeHandGroup[] }) {
  const handEntries = handGroups
    .filter((group) => !isMeldPracticeGroup(group))
    .flatMap((group, groupIndex) =>
      group.tiles.map((tile, tileIndex) => ({
        tile,
        groupIndex,
        tileIndex,
        isWinning: tileIndex === group.winningIndex,
        isBack: group.backIndexes?.includes(tileIndex) ?? false,
      })),
    );
  const winningEntry = handEntries.find((entry) => entry.isWinning);
  const handTiles = handEntries
    .filter((entry) => !entry.isWinning)
    .sort((left, right) => pointTileOrder(left.tile) - pointTileOrder(right.tile));
  const floatingWinAnchorIndex = winningEntry ? Math.max(0, handTiles.length - 2) : -1;
  const meldGroups = handGroups.filter(isMeldPracticeGroup);

  return (
    <div className="mj-point-hand-scene" aria-label="题面牌姿">
      <div className="mj-point-hand-scene__hand" aria-label="手牌">
        {handTiles.map(({ tile, groupIndex, tileIndex, isBack }, index) => (
          <PracticeHandTile
            key={`hand-${groupIndex}-${tile}-${tileIndex}`}
            code={tile}
            back={isBack}
            floatingWinCode={index === floatingWinAnchorIndex ? winningEntry?.tile : undefined}
          />
        ))}
      </div>

      {meldGroups.length > 0 ? (
        <div className="mj-point-hand-scene__melds" aria-label="副露与杠">
          {meldGroups.map((group, index) => (
            <PracticeHandMeld key={`meld-${index}`} group={group} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PointPracticePage() {
  const practice = useGeneratedPracticeQuestion(generatePointPracticeQuestion);
  const [draft, setDraft] = useState('');
  const [feedback, setFeedback] = useState<PracticeFeedback<number> | null>(null);
  const [streak, setStreak] = useState(0);
  const [showLookup, setShowLookup] = useState(true);
  const { question } = practice;
  const rows = useMemo(
    () => makePointLookupRows(question.noYaku ? 1 : question.han, question.seatWind === 'east'),
    [question.han, question.noYaku, question.seatWind],
  );

  const submit = () => {
    if (feedback) return;
    const result = checkPointPracticeAnswer(question, Number(draft || 0));
    setFeedback(result);
    setStreak((value) => (result.correct ? value + 1 : 0));
  };

  const resetQuestion = () => {
    setDraft('');
    setFeedback(null);
  };

  const nextQuestion = () => {
    resetQuestion();
    practice.nextQuestion();
  };

  const randomQuestion = () => {
    resetQuestion();
    practice.randomQuestion();
  };

  return (
    <div className="mj-page-stack mj-practice-design mj-point-practice-page">
      <ContentSection aria-label="题面手牌" className="mj-practice-hand-section mj-point-hand-section">
        <PracticeHandScene handGroups={question.handGroups} />
        <div className="mj-practice-hand-meta">
          <Chip selected>{question.seatWind === 'east' ? '亲家' : '闲家'}</Chip>
          <Chip selected>{formatWinMethod(question.winMethod)}</Chip>
          <Chip selected>{WIND_LABELS[question.roundWind]}场{WIND_LABELS[question.seatWind]}家</Chip>
          {question.visibleConditions.map((condition) => <Chip key={condition} selected>{condition}</Chip>)}
        </div>
      </ContentSection>

      <FieldGroup legend="输入总获得点数">
        <input
          className="mj-point-answer-input"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="例如 7700"
          value={draft}
          disabled={Boolean(feedback)}
          onChange={(event) => {
            setDraft(event.target.value.replace(/\D/g, ''));
          }}
        />
        <ActionButton disabled={!draft || Boolean(feedback)} fullWidth icon={<Check aria-hidden="true" />} onClick={submit}>
          提交答案
        </ActionButton>
      </FieldGroup>

      <ContentSection className="mj-practice-lookup-section" title="番符点数表">
        <div className="mj-practice-lookup-toggle">
          <ActionButton icon={<Eye aria-hidden="true" />} size="sm" variant="ghost" onClick={() => setShowLookup((value) => !value)}>
            {showLookup ? '隐藏查询表' : '显示查询表'}
          </ActionButton>
        </div>
        {showLookup ? (
          <DataTable
            columns={[
              { id: 'label', header: '番符' },
              { id: 'ron', header: question.seatWind === 'east' ? '庄家荣和' : '闲家荣和' },
              { id: 'tsumo', header: question.seatWind === 'east' ? '庄家自摸' : '闲家自摸' },
            ]}
            rows={rows}
            rowKey={(row) => String(row.id)}
          />
        ) : null}
      </ContentSection>

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
              <ActionButton icon={<Sparkles aria-hidden="true" />} onClick={nextQuestion}>
                下一题
              </ActionButton>
            </div>
          }
        />
      ) : null}
      <RandomQuestionButton onClick={randomQuestion} />
    </div>
  );
}

export function ComebackPracticePage() {
  const practice = useGeneratedPracticeQuestion(generateComebackPracticeQuestion);
  const [answers, setAnswers] = useState<Record<number, FuValue | 'impossible'>>({});
  const [feedback, setFeedback] = useState<PracticeFeedback<Record<number, FuValue | 'impossible'>> | null>(null);
  const [streak, setStreak] = useState(0);
  const { question } = practice;
  const isComplete = question.hanTiers.every((han) => answers[han] !== undefined);

  const submit = () => {
    if (feedback) return;
    const result = checkComebackPracticeAnswer(question, answers);
    setFeedback(result);
    setStreak((value) => (result.correct ? value + 1 : 0));
  };

  const resetQuestion = () => {
    setAnswers({});
    setFeedback(null);
  };

  const nextQuestion = () => {
    resetQuestion();
    practice.nextQuestion();
  };

  const randomQuestion = () => {
    resetQuestion();
    practice.randomQuestion();
  };

  const selectAnswer = (han: number, option: FuValue | 'impossible') => {
    if (feedback) return;
    setAnswers((value) => ({ ...value, [han]: option }));
  };

  return (
    <div className="mj-page-stack mj-practice-design mj-comeback-practice-page">
      <FieldGroup className="mj-comeback-workspace" legend="逆转所需番符" legendVisibility="sr-only">
        <div className="mj-comeback-workspace__body">
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
                    const disabled = Boolean(feedback) || !isComebackOptionAvailable(han, option);
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

        <div className="mj-comeback-workspace__footer">
          <ActionButton disabled={!isComplete || Boolean(feedback)} fullWidth icon={<Check aria-hidden="true" />} onClick={submit}>
            确认答案
          </ActionButton>
          <ActionButton fullWidth icon={<Calculator aria-hidden="true" />} variant="ghost" onClick={() => {
            window.location.hash = '#/han-fu-calculator';
          }}>
            查看番符点数计算器
          </ActionButton>
        </div>
      </FieldGroup>
      <RandomQuestionButton onClick={randomQuestion} />
    </div>
  );
}
