import {
  derivePracticeSeed,
  generateChinitsuHand,
  generateScoredPracticeHand,
  makePracticeQuestionId,
  SeededRandom,
  type PracticeHandGroup,
} from './practice-generation';
import { calculateScoreCost, getLegalRonFuOptions, type FuValue, type HanValue, type WinMethod } from './points';
import { createTile, tileLabel, type Tile, type TileCode, type Wind } from './tiles';

export type { PracticeHandGroup, PracticeHandGroupKind } from './practice-generation';

export interface PracticeFeedback<TAnswer> {
  correct: boolean;
  userAnswer: TAnswer;
  correctAnswer: TAnswer;
  breakdown: string[];
}

export interface ChinituWaitQuestion {
  id: string;
  suit: 'm' | 'p' | 's';
  handTiles: Tile[];
  candidateRanks: number[];
  correctWaits: number[];
}

export interface FuPracticeQuestion {
  id: string;
  handTiles: Tile[];
  handGroups: readonly PracticeHandGroup[];
  roundWind: Wind;
  seatWind: Wind;
  winMethod: WinMethod;
  visibleConditions: readonly string[];
  answerFu: number;
  breakdown: string[];
}

export interface PointPracticeQuestion {
  id: string;
  handTiles: Tile[];
  handGroups: readonly PracticeHandGroup[];
  roundWind: Wind;
  seatWind: Wind;
  winMethod: WinMethod;
  visibleConditions: readonly string[];
  isSevenPairs: boolean;
  han: number;
  fu: number;
  noYaku: boolean;
  answerTotalPoints: number;
  breakdown: string[];
}

export interface ComebackPracticeQuestion {
  id: string;
  userSeatWind: Wind;
  targetSeatWind: Wind;
  pointGap: number;
  winMethod: 'ron';
  hanTiers: HanValue[];
  answers: Record<number, FuValue | 'impossible'>;
  breakdown: string[];
}

export const FU_PRACTICE_OPTIONS: readonly number[] = [
  20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170,
];

function uniqueSortedNumbers(values: readonly number[]): number[] {
  return [...new Set(values)].sort((left, right) => left - right);
}

function handFingerprintPayload(hand: {
  handGroups: readonly PracticeHandGroup[];
  roundWind: Wind;
  seatWind: Wind;
  winMethod: WinMethod;
  visibleConditions: readonly string[];
}): Record<string, unknown> {
  return {
    groups: hand.handGroups.map((group) => ({
      kind: group.kind,
      tiles: group.tiles,
      calledIndex: group.calledIndex,
      backIndexes: group.backIndexes,
      winningIndex: group.winningIndex,
    })),
    roundWind: hand.roundWind,
    seatWind: hand.seatWind,
    winMethod: hand.winMethod,
    visibleConditions: hand.visibleConditions,
  };
}

export function generateChinituWaitQuestion(seed = 0): ChinituWaitQuestion {
  return generateChinitsuHand(seed);
}

export function checkChinituWaitAnswer(
  question: ChinituWaitQuestion,
  selectedRanks: readonly number[],
): PracticeFeedback<number[]> {
  const userAnswer = uniqueSortedNumbers(selectedRanks);
  const correctAnswer = uniqueSortedNumbers(question.correctWaits);
  const correct = userAnswer.length === correctAnswer.length && userAnswer.every((rank, index) => rank === correctAnswer[index]);
  return {
    correct,
    userAnswer,
    correctAnswer,
    breakdown: [
      `标准听牌：${correctAnswer.length ? correctAnswer.map((rank) => `${rank}${question.suit}`).join('、') : '无'}`,
      `您的答案：${userAnswer.length ? userAnswer.map((rank) => `${rank}${question.suit}`).join('、') : '未选择'}`,
    ],
  };
}

export function generateFuPracticeQuestion(seed = 0): FuPracticeQuestion {
  const hand = generateScoredPracticeHand(seed, 'fu');
  const answerFu = hand.score.fu;
  if (answerFu === undefined || !FU_PRACTICE_OPTIONS.includes(answerFu)) {
    throw new Error(`Generated fu practice answer is outside the supported range: ${answerFu}`);
  }
  const breakdown = (hand.score.fu_details ?? []).map((item) => `${item.name} ${item.fu} 符`);
  breakdown.push(`合计并进位为 ${answerFu} 符`);

  return {
    id: makePracticeQuestionId('fu', handFingerprintPayload(hand)),
    handTiles: hand.handTiles,
    handGroups: hand.handGroups,
    roundWind: hand.roundWind,
    seatWind: hand.seatWind,
    winMethod: hand.winMethod,
    visibleConditions: hand.visibleConditions,
    answerFu,
    breakdown,
  };
}

export function checkFuPracticeAnswer(question: FuPracticeQuestion, answerFu: number): PracticeFeedback<number> {
  return {
    correct: answerFu === question.answerFu,
    userAnswer: answerFu,
    correctAnswer: question.answerFu,
    breakdown: question.breakdown,
  };
}

function formatYakuHan(han: number | 'yakuman' | 'double-yakuman'): string {
  if (han === 'yakuman') return '役满';
  if (han === 'double-yakuman') return '双倍役满';
  return `${han} 番`;
}

export function generatePointPracticeQuestion(seed = 0): PointPracticeQuestion {
  const choiceRng = new SeededRandom(derivePracticeSeed(seed, 'point-question-kind'));
  const noYaku = choiceRng.int(10) === 0;
  const sevenPairs = !noYaku && choiceRng.int(10) === 0;
  const hand = generateScoredPracticeHand(seed, noYaku ? 'point-no-yaku' : 'point-valid', { sevenPairs });
  const payload = handFingerprintPayload(hand);

  if (noYaku) {
    return {
      id: makePracticeQuestionId('point', { ...payload, noYaku: true }),
      handTiles: hand.handTiles,
      handGroups: hand.handGroups,
      roundWind: hand.roundWind,
      seatWind: hand.seatWind,
      winMethod: hand.winMethod,
      visibleConditions: hand.visibleConditions,
      isSevenPairs: false,
      han: 0,
      fu: 0,
      noYaku: true,
      answerTotalPoints: 0,
      breakdown: ['该牌形没有役，标准答案为 0 点。'],
    };
  }

  const fu = hand.score.fu;
  const cost = hand.score.cost;
  if (fu === undefined || !cost) throw new Error('Generated point practice hand has no score details');
  const yaku = hand.score.yaku.map((item) => `${item.name} ${formatYakuHan(item.han)}`).join('、');
  const payment = hand.winMethod === 'ron'
    ? `荣和 ${cost.main.toLocaleString('zh-CN')} 点`
    : `自摸总计 ${cost.total.toLocaleString('zh-CN')} 点`;

  return {
    id: makePracticeQuestionId('point', { ...payload, noYaku: false }),
    handTiles: hand.handTiles,
    handGroups: hand.handGroups,
    roundWind: hand.roundWind,
    seatWind: hand.seatWind,
    winMethod: hand.winMethod,
    visibleConditions: hand.visibleConditions,
    isSevenPairs: hand.isSevenPairs,
    han: hand.score.han,
    fu,
    noYaku: false,
    answerTotalPoints: cost.total,
    breakdown: [
      `役种：${yaku}`,
      `${hand.score.han} 番 ${fu} 符`,
      hand.score.is_dealer ? '庄家' : '闲家',
      payment,
    ],
  };
}

export function checkPointPracticeAnswer(question: PointPracticeQuestion, answerTotalPoints: number): PracticeFeedback<number> {
  return {
    correct: answerTotalPoints === question.answerTotalPoints,
    userAnswer: answerTotalPoints,
    correctAnswer: question.answerTotalPoints,
    breakdown: question.breakdown,
  };
}

export function minimumFuForComeback(params: {
  han: HanValue;
  pointGap: number;
  isDealer: boolean;
}): FuValue | 'impossible' {
  for (const fu of getLegalRonFuOptions(params.han)) {
    const point = calculateScoreCost({ han: params.han, fu, is_dealer: params.isDealer, is_tsumo: false });
    if (point.cost.main >= params.pointGap) return fu;
  }
  return 'impossible';
}

export function generateComebackPracticeQuestion(seed = 0): ComebackPracticeQuestion {
  const rng = new SeededRandom(derivePracticeSeed(seed, 'comeback'));
  const hanTiers: HanValue[] = [1, 2, 3, 4];

  for (let attempt = 0; attempt < 256; attempt += 1) {
    const userSeatWind = rng.pick<Wind>(['east', 'south', 'west', 'north']);
    const targetSeatWind = rng.pick<Wind>(['east', 'south', 'west', 'north'].filter((wind) => wind !== userSeatWind) as Wind[]);
    const pointGap = 1000 + rng.int(111) * 100;
    const isDealer = userSeatWind === 'east';
    const answers = Object.fromEntries(
      hanTiers.map((han) => [han, minimumFuForComeback({ han, pointGap, isDealer })]),
    ) as Record<number, FuValue | 'impossible'>;
    const answerValues = Object.values(answers);
    if (!answerValues.includes('impossible') || !answerValues.some((answer) => answer !== 'impossible')) continue;

    return {
      id: makePracticeQuestionId('comeback', { userSeatWind, targetSeatWind, pointGap, answers }),
      userSeatWind,
      targetSeatWind,
      pointGap,
      winMethod: 'ron',
      hanTiers,
      answers,
      breakdown: hanTiers.map((han) => {
        const answer = answers[han];
        return `${han} 番：${answer === 'impossible' ? '不可逆转' : `最低 ${answer} 符`}`;
      }),
    };
  }

  const userSeatWind: Wind = normalizeComebackSeat(seed);
  const targetSeatWind: Wind = userSeatWind === 'east' ? 'south' : 'east';
  const pointGap = userSeatWind === 'east' ? 7700 : 5000;
  const answers = Object.fromEntries(
    hanTiers.map((han) => [han, minimumFuForComeback({ han, pointGap, isDealer: userSeatWind === 'east' })]),
  ) as Record<number, FuValue | 'impossible'>;
  return {
    id: makePracticeQuestionId('comeback', { userSeatWind, targetSeatWind, pointGap, answers }),
    userSeatWind,
    targetSeatWind,
    pointGap,
    winMethod: 'ron',
    hanTiers,
    answers,
    breakdown: hanTiers.map((han) => {
      const answer = answers[han];
      return `${han} 番：${answer === 'impossible' ? '不可逆转' : `最低 ${answer} 符`}`;
    }),
  };
}

function normalizeComebackSeat(seed: number): Wind {
  return (Math.trunc(seed) >>> 0) % 2 === 0 ? 'west' : 'east';
}

export function checkComebackPracticeAnswer(
  question: ComebackPracticeQuestion,
  userAnswers: Record<number, FuValue | 'impossible'>,
): PracticeFeedback<Record<number, FuValue | 'impossible'>> {
  const correct = question.hanTiers.every((han) => userAnswers[han] === question.answers[han]);
  return {
    correct,
    userAnswer: userAnswers,
    correctAnswer: question.answers,
    breakdown: question.breakdown,
  };
}

export function describePracticeHand(tiles: readonly Tile[]): string {
  return tiles.map(tileLabel).join(' ');
}

export function makeTile(code: TileCode): Tile {
  return createTile(code);
}
