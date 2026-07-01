import { calculateHandEfficiency } from './efficiency';
import { calculatePoint, getLegalRonFuOptions, type FuValue, type HanValue, type WinMethod } from './points';
import { createTile, parseTileCodes, tileLabel, type Tile, type TileCode, type Wind } from './tiles';

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
  roundWind: Wind;
  seatWind: Wind;
  winMethod: WinMethod;
  answerFu: number;
  breakdown: string[];
}

export interface PointPracticeQuestion {
  id: string;
  handTiles: Tile[];
  roundWind: Wind;
  seatWind: Wind;
  winMethod: WinMethod;
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

const CHINITU_FIXTURE_CODES: readonly TileCode[][] = [
  ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9'],
  ['m2', 'm3', 'm3', 'm4', 'm4', 'm5', 'm5', 'm6', 'm6', 'm7', 'm7', 'm8', 'm8'],
];

const FU_QUESTIONS: readonly Omit<FuPracticeQuestion, 'handTiles'>[] & { handTileCodes?: never } = [
  {
    id: 'fu-menron-edge-yakuhai',
    roundWind: 'east',
    seatWind: 'south',
    winMethod: 'ron',
    answerFu: 40,
    breakdown: ['底符 20', '门前清荣和 10', '边张听牌 2', '役牌雀头 2', '合计 34，进位 40 符'],
  },
  {
    id: 'fu-tsumo-open-triplet',
    roundWind: 'south',
    seatWind: 'south',
    winMethod: 'tsumo',
    answerFu: 40,
    breakdown: ['底符 20', '自摸 2', '幺九暗刻 8', '连风雀头 4', '合计 34，进位 40 符'],
  },
];

const FU_HANDS: Record<string, TileCode[]> = {
  'fu-menron-edge-yakuhai': ['m1', 'm2', 'm3', 'm7', 'm8', 'm9', 'p1', 'p2', 'p3', 's7', 's8', 's9', 'z5', 'z5'],
  'fu-tsumo-open-triplet': ['m1', 'm1', 'm1', 'p2', 'p3', 'p4', 'p7', 'p8', 'p9', 's4', 's5', 's6', 'z2', 'z2'],
};

const POINT_HAND: TileCode[] = ['m2', 'm3', 'm4', 'm3', 'm4', 'm5', 'p2', 'p3', 'p4', 's6', 's7', 's8', 'p5', 'p5'];

function pick<T>(items: readonly T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

function ranksFromEffectiveTiles(question: ChinituWaitQuestion): number[] {
  const result = calculateHandEfficiency({ mode: 'yonma', handTiles: question.handTiles });
  return result.effectiveTiles
    .filter((entry) => entry.tile.suit === question.suit)
    .map((entry) => Number(entry.tile.rank))
    .sort((a, b) => a - b);
}

function uniqueSortedNumbers(values: readonly number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

export function generateChinituWaitQuestion(seed = 0): ChinituWaitQuestion {
  const codes = pick(CHINITU_FIXTURE_CODES, seed);
  const question: ChinituWaitQuestion = {
    id: `chinitu-${seed % CHINITU_FIXTURE_CODES.length}`,
    suit: codes[0][0] as 'm' | 'p' | 's',
    handTiles: parseTileCodes(codes),
    candidateRanks: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    correctWaits: [],
  };
  question.correctWaits = ranksFromEffectiveTiles(question);
  return question;
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
  const base = pick(FU_QUESTIONS, seed);
  return {
    ...base,
    handTiles: parseTileCodes(FU_HANDS[base.id]),
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

export function generatePointPracticeQuestion(seed = 0): PointPracticeQuestion {
  if (seed % 5 === 4) {
    return {
      id: 'point-no-yaku',
      handTiles: parseTileCodes(POINT_HAND),
      roundWind: 'south',
      seatWind: 'north',
      winMethod: 'ron',
      han: 0,
      fu: 0,
      noYaku: true,
      answerTotalPoints: 0,
      breakdown: ['题目无役时标准答案为 0。'],
    };
  }

  const variants = [
    { han: 1, fu: 30, seatWind: 'north' as const, winMethod: 'ron' as const },
    { han: 2, fu: 40, seatWind: 'east' as const, winMethod: 'tsumo' as const },
    { han: 3, fu: 40, seatWind: 'west' as const, winMethod: 'tsumo' as const },
  ];
  const variant = pick(variants, seed);
  const point = calculatePoint({
    han: variant.han,
    fu: variant.fu,
    isDealer: variant.seatWind === 'east',
    winMethod: variant.winMethod,
  });

  return {
    id: `point-${variant.han}-${variant.fu}-${variant.seatWind}-${variant.winMethod}`,
    handTiles: parseTileCodes(POINT_HAND),
    roundWind: 'south',
    seatWind: variant.seatWind,
    winMethod: variant.winMethod,
    han: variant.han,
    fu: variant.fu,
    noYaku: false,
    answerTotalPoints: point.payments.totalGain,
    breakdown: [
      `${variant.han} 番 ${variant.fu} 符`,
      variant.seatWind === 'east' ? '庄家' : '子家',
      variant.winMethod === 'ron' ? `荣和 ${point.payments.ron} 点` : `自摸合计 ${point.payments.totalGain} 点`,
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
    const point = calculatePoint({ han: params.han, fu, isDealer: params.isDealer, winMethod: 'ron' });
    if ((point.payments.ron ?? 0) >= params.pointGap) return fu;
  }
  return 'impossible';
}

export function generateComebackPracticeQuestion(seed = 0): ComebackPracticeQuestion {
  const pointGap = seed % 2 === 0 ? 5000 : 7700;
  const userSeatWind: Wind = seed % 3 === 0 ? 'west' : 'east';
  const targetSeatWind: Wind = userSeatWind === 'east' ? 'south' : 'east';
  const hanTiers: HanValue[] = [1, 2, 3, 4];
  const isDealer = userSeatWind === 'east';
  const answers = Object.fromEntries(
    hanTiers.map((han) => [han, minimumFuForComeback({ han, pointGap, isDealer })]),
  ) as Record<number, FuValue | 'impossible'>;

  return {
    id: `comeback-${userSeatWind}-${pointGap}`,
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
