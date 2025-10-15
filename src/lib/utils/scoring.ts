/**
 * Score a single question attempt
 * @param {Object} question - question object from DB { id, answer, topic, difficulty }
 * @param {String} userAnswer - user's answer string
 * @param {Number} timeSpentSeconds - time spent on this question
 * @returns {Object} { correct: boolean, points: 1|0, topic, difficulty, timeSpentSeconds }
 */
export function scoreQuestion(question: { id: string; answer: string; topic: string; difficulty: string }, userAnswer: string, timeSpentSeconds: number) {
  // Normalize answers (trim, uppercase)
  const normalize = (s: string) => (s || "").toString().trim().toUpperCase();
  const correct = normalize(userAnswer) === normalize(question.answer);
  return {
    qid: question.id,
    correct,
    points: correct ? 1 : 0,
    topic: question.topic || "unknown",
    difficulty: question.difficulty || "medium",
    timeSpentSeconds: timeSpentSeconds || 0,
  };
}

interface ScoredQuestion {
  points: number;
  timeSpentSeconds: number;
  topic: string;
  difficulty: string;
}

interface AggregatedResults {
  totalQuestions: number;
  totalCorrect: number;
  accuracy: number;
  avgTimePerQuestion: number;
  byTopic: Record<string, { correct: number; total: number; accuracy: number }>;
  byDifficulty: Record<string, { correct: number; total: number; accuracy: number }>;
}

/**
 * Aggregate section and exam results
 * @param {Array} scoredQuestions - array of scored question objects
 */
export function aggregateResults(scoredQuestions: ScoredQuestion[]): AggregatedResults {
  const result: AggregatedResults = {
    totalQuestions: scoredQuestions.length,
    totalCorrect: 0,
    accuracy: 0,
    avgTimePerQuestion: 0,
    byTopic: {},     // topic -> { correct, total, accuracy }
    byDifficulty: {},// difficulty -> { correct, total, accuracy }
  };

  let totalTime = 0;
  for (const s of scoredQuestions) {
    result.totalCorrect += s.points;
    totalTime += s.timeSpentSeconds || 0;

    // topic
    result.byTopic[s.topic] = result.byTopic[s.topic] || { correct: 0, total: 0 };
    result.byTopic[s.topic].correct += s.points;
    result.byTopic[s.topic].total += 1;

    // difficulty
    result.byDifficulty[s.difficulty] = result.byDifficulty[s.difficulty] || { correct: 0, total: 0 };
    result.byDifficulty[s.difficulty].correct += s.points;
    result.byDifficulty[s.difficulty].total += 1;
  }

  result.accuracy = result.totalQuestions ? +(result.totalCorrect / result.totalQuestions) : 0;
  result.avgTimePerQuestion = result.totalQuestions ? +(totalTime / result.totalQuestions) : 0;

  // compute topic accuracy percents
  for (const t of Object.keys(result.byTopic)) {
    const s = result.byTopic[t];
    s.accuracy = s.total ? +(s.correct / s.total) : 0;
  }
  for (const d of Object.keys(result.byDifficulty)) {
    const s = result.byDifficulty[d];
    s.accuracy = s.total ? +(s.correct / s.total) : 0;
  }
  return result;
}

/**
 * Convert raw percent to an approximate SAT total (0-1600).
 * IMPORTANT: SAT scaling is complex; this is a simple linear approximation:
 * percentCorrect -> scaledScore = Math.round(percent * 1600)
 * Use only for rough projections.
 */
export function approximateSatScale(percent: number) {
  // Bound percent
  const p = Math.max(0, Math.min(1, percent));
  return Math.round(p * 1600);
}