import { describe, it, expect } from 'vitest';
import { calculateSM2 } from './sm2';

describe('SM-2 Spaced Repetition Algorithm', () => {
  it('sets interval to 1 day on first correct review', () => {
    const res = calculateSM2({
      grade: 4,
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
    });
    expect(res.repetitions).toBe(1);
    expect(res.interval).toBe(1);
  });

  it('sets interval to 6 days on second correct review', () => {
    const res = calculateSM2({
      grade: 5,
      repetitions: 1,
      interval: 1,
      easeFactor: 2.5,
    });
    expect(res.repetitions).toBe(2);
    expect(res.interval).toBe(6);
  });

  it('resets interval and repetitions on failed recall (grade < 3)', () => {
    const res = calculateSM2({
      grade: 1,
      repetitions: 5,
      interval: 30,
      easeFactor: 2.6,
    });
    expect(res.repetitions).toBe(0);
    expect(res.interval).toBe(1);
    expect(res.easeFactor).toBeLessThan(2.6);
  });
});
