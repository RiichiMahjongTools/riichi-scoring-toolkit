import { describe, expect, it } from 'vitest';
import {
  checkChinituWaitAnswer,
  checkComebackPracticeAnswer,
  checkFuPracticeAnswer,
  checkPointPracticeAnswer,
  generateChinituWaitQuestion,
  generateComebackPracticeQuestion,
  generateFuPracticeQuestion,
  generatePointPracticeQuestion,
} from '../domain/practice';

describe('practice engines', () => {
  it('checks chinitu waits by exact selected rank set', () => {
    const question = generateChinituWaitQuestion(0);
    expect(question.correctWaits).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(checkChinituWaitAnswer(question, question.correctWaits).correct).toBe(true);
    expect(checkChinituWaitAnswer(question, [1, 9]).correct).toBe(false);
  });

  it('checks fu practice answers with breakdown feedback', () => {
    const question = generateFuPracticeQuestion(0);
    const feedback = checkFuPracticeAnswer(question, question.answerFu);
    expect(feedback.correct).toBe(true);
    expect(feedback.breakdown.length).toBeGreaterThan(0);
  });

  it('uses 0 as the point-practice answer for no-yaku questions', () => {
    const question = generatePointPracticeQuestion(4);
    expect(question.noYaku).toBe(true);
    expect(checkPointPracticeAnswer(question, 0).correct).toBe(true);
  });

  it('checks comeback minimum-fu answers', () => {
    const question = generateComebackPracticeQuestion(0);
    expect(question.answers).toEqual({ 1: 'impossible', 2: 80, 3: 40, 4: 25 });
    expect(checkComebackPracticeAnswer(question, question.answers).correct).toBe(true);
  });
});
