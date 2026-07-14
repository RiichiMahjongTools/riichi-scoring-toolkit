import { describe, expect, it } from 'vitest';
import {
  checkChinituWaitAnswer,
  checkComebackPracticeAnswer,
  checkFuPracticeAnswer,
  checkPointPracticeAnswer,
  FU_PRACTICE_OPTIONS,
  generateChinituWaitQuestion,
  generateComebackPracticeQuestion,
  generateFuPracticeQuestion,
  generatePointPracticeQuestion,
  minimumFuForComeback,
} from '../domain/practice';
import {
  countGeneratedPhysicalTiles,
  generateScoredPracticeHand,
} from '../domain/practice-generation';
import { calculateHandEfficiency } from '../domain/efficiency';
import { calculateScoreOrEfficiency } from '../domain/scoring';
import { countPhysicalTiles, isRedFive, tileRank, tileSuit } from '../domain/tiles';

function expectAtMostFour(counts: ReadonlyMap<string, number>): void {
  for (const count of counts.values()) expect(count).toBeLessThanOrEqual(4);
}

describe('algorithmic practice generators', () => {
  it('is deterministic for every practice type', () => {
    for (const seed of [0, 1, 17, 2026, 0xffffffff]) {
      expect(generateChinituWaitQuestion(seed)).toEqual(generateChinituWaitQuestion(seed));
      expect(generateFuPracticeQuestion(seed)).toEqual(generateFuPracticeQuestion(seed));
      expect(generatePointPracticeQuestion(seed)).toEqual(generatePointPracticeQuestion(seed));
      expect(generateComebackPracticeQuestion(seed)).toEqual(generateComebackPracticeQuestion(seed));
    }
  });

  it('generates 500 legal multi-wait chinitsu questions', () => {
    const ids = new Set<string>();

    for (let seed = 0; seed < 500; seed += 1) {
      const question = generateChinituWaitQuestion(seed);
      const result = calculateHandEfficiency({ mode: 'yonma', handTiles: question.handTiles });
      const waits = result.effective_tiles
        .filter((entry) => entry.remaining_count > 0 && tileSuit(entry.tile) === question.suit)
        .map((entry) => Number(tileRank(entry.tile)))
        .sort((left, right) => left - right);

      ids.add(question.id);
      expect(question.handTiles).toHaveLength(13);
      expect(new Set(question.handTiles.map(tileSuit))).toEqual(new Set([question.suit]));
      expect(result.shanten).toBe(0);
      expect(question.correctWaits.length).toBeGreaterThanOrEqual(2);
      expect(question.correctWaits).toEqual([...new Set(waits)]);
      expectAtMostFour(countPhysicalTiles(question.handTiles));
      expect(checkChinituWaitAnswer(question, question.correctWaits).correct).toBe(true);
      expect(checkChinituWaitAnswer(question, question.correctWaits.slice(1)).correct).toBe(false);
    }

    expect(ids.size).toBeGreaterThanOrEqual(400);
  });

  it('generates 250 engine-verified standard fu questions', () => {
    const ids = new Set<string>();

    for (let seed = 0; seed < 250; seed += 1) {
      const question = generateFuPracticeQuestion(seed);
      const hand = generateScoredPracticeHand(seed, 'fu');
      const rescored = calculateScoreOrEfficiency(hand.scoreInput);

      ids.add(question.id);
      expect(rescored.kind).toBe('score');
      if (rescored.kind !== 'score') continue;
      expect(rescored.result.valid).toBe(true);
      expect(rescored.result.fu).toBe(question.answerFu);
      expect(hand.isSevenPairs).toBe(false);
      expect(hand.scoreInput.handTiles.length + hand.scoreInput.melds.length * 3).toBe(14);
      expect(hand.scoreInput.handTiles).toContain(hand.scoreInput.winTile);
      expect(hand.visibleConditions).toEqual([question.winMethod === 'tsumo' ? '海底摸月' : '河底捞鱼']);
      expect(FU_PRACTICE_OPTIONS).toContain(question.answerFu);
      expectAtMostFour(countGeneratedPhysicalTiles(hand));
      expect(checkFuPracticeAnswer(question, question.answerFu).correct).toBe(true);
      expect(checkFuPracticeAnswer(question, question.answerFu === 20 ? 30 : 20).correct).toBe(false);
    }

    expect(ids.size).toBeGreaterThanOrEqual(200);
  });

  it('generates 250 visible-condition point questions with no-yaku and seven-pairs coverage', () => {
    const ids = new Set<string>();
    let noYakuCount = 0;
    let sevenPairsCount = 0;
    let standardCount = 0;

    for (let seed = 0; seed < 250; seed += 1) {
      const question = generatePointPracticeQuestion(seed);
      const target = question.noYaku ? 'point-no-yaku' : 'point-valid';
      const hand = generateScoredPracticeHand(seed, target, { sevenPairs: question.isSevenPairs });
      const rescored = calculateScoreOrEfficiency(hand.scoreInput);

      ids.add(question.id);
      expect(rescored.kind).toBe('score');
      if (rescored.kind !== 'score') continue;
      expect(hand.scoreInput.mode).toBe('yonma');
      expect(hand.scoreInput.honba).toBe(0);
      expect(hand.scoreInput.doraIndicators).toEqual([]);
      expect(hand.scoreInput.uraDoraIndicators).toEqual([]);
      expect(hand.scoreInput.conditions.riichi).toBe(false);
      expect(hand.scoreInput.conditions.doubleRiichi).toBe(false);
      expect(hand.scoreInput.conditions.ippatsu).toBe(false);
      expect(hand.scoreInput.conditions.haiteiOrHoutei).toBe(false);
      expect(question.visibleConditions).toEqual([]);
      expect([...hand.scoreInput.handTiles, ...hand.scoreInput.melds.flatMap((meld) => meld.tiles)].some(isRedFive)).toBe(false);
      expectAtMostFour(countGeneratedPhysicalTiles(hand));

      if (question.noYaku) {
        noYakuCount += 1;
        expect(rescored.result.valid).toBe(false);
        expect(question.answerTotalPoints).toBe(0);
        expect(checkPointPracticeAnswer(question, 0).correct).toBe(true);
      } else {
        expect(rescored.result.valid).toBe(true);
        expect(rescored.result.fu).toBe(question.fu);
        expect(rescored.result.han).toBe(question.han);
        expect(rescored.result.cost?.total).toBe(question.answerTotalPoints);
        expect(checkPointPracticeAnswer(question, question.answerTotalPoints).correct).toBe(true);
        if (question.isSevenPairs) {
          sevenPairsCount += 1;
          expect(question.fu).toBe(25);
          expect(question.handGroups).toHaveLength(7);
        } else {
          standardCount += 1;
          expect(question.handGroups).toHaveLength(5);
        }
      }
    }

    expect(ids.size).toBeGreaterThanOrEqual(200);
    expect(noYakuCount).toBeGreaterThanOrEqual(15);
    expect(sevenPairsCount).toBeGreaterThanOrEqual(15);
    expect(standardCount).toBeGreaterThan(150);
  });

  it('generates 500 varied comeback questions and recomputes every answer', () => {
    const ids = new Set<string>();

    for (let seed = 0; seed < 500; seed += 1) {
      const question = generateComebackPracticeQuestion(seed);
      const values = Object.values(question.answers);

      ids.add(question.id);
      expect(question.userSeatWind).not.toBe(question.targetSeatWind);
      expect(question.pointGap).toBeGreaterThanOrEqual(1000);
      expect(question.pointGap).toBeLessThanOrEqual(12000);
      expect(question.pointGap % 100).toBe(0);
      expect(values).toContain('impossible');
      expect(values.some((value) => value !== 'impossible')).toBe(true);

      for (const han of question.hanTiers) {
        expect(question.answers[han]).toBe(minimumFuForComeback({
          han,
          pointGap: question.pointGap,
          isDealer: question.userSeatWind === 'east',
        }));
      }
      expect(checkComebackPracticeAnswer(question, question.answers).correct).toBe(true);
    }

    expect(ids.size).toBeGreaterThanOrEqual(300);
  });
});
