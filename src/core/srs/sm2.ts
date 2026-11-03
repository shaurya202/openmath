/**
 * SuperMemo SM-2 Algorithm implementation for OpenMath flashcards.
 * Calculates next review interval, repetition count, and ease factor (EF).
 */

export interface SM2Input {
  grade: number; // 0 to 5 (0: complete blackout, 5: perfect response)
  repetitions: number;
  interval: number; // days
  easeFactor: number; // typically starts at 2.5
}

export interface SM2Output {
  repetitions: number;
  interval: number; // days
  easeFactor: number;
  nextReviewDate: number; // unix timestamp in ms
}

export function calculateSM2({
  grade,
  repetitions,
  interval,
  easeFactor,
}: SM2Input): SM2Output {
  // Bound grade between 0 and 5
  const q = Math.max(0, Math.min(5, grade));

  let newRepetitions = repetitions;
  let newInterval = interval;
  let newEaseFactor = easeFactor;

  if (q >= 3) {
    // Correct response
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(newInterval * newEaseFactor);
    }
    newRepetitions += 1;
  } else {
    // Incorrect response, reset repetitions
    newRepetitions = 0;
    newInterval = 1;
  }

  // Calculate new Ease Factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEaseFactor = newEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  const nextReviewDate = Date.now() + newInterval * 24 * 60 * 60 * 1000;

  return {
    repetitions: newRepetitions,
    interval: newInterval,
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    nextReviewDate,
  };
}
