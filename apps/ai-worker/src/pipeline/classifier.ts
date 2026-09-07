import type { ProblemCategory } from '@sih/shared-types';
import { PROBLEM_CATEGORIES } from '@sih/shared-types';
import { CATEGORY_KEYWORDS } from './taxonomy.js';

export interface ClassificationResult {
  category: ProblemCategory;
  confidence: number;
  matchedKeywords: string[];
  /** Raw weighted score per category, for debugging/tuning — see AiDebugPayload on the API side. */
  scores: Record<ProblemCategory, number>;
}

/**
 * Fully offline keyword classifier — the primary path, per PRD assumption
 * that the demo must work with zero external network calls. Runs a weighted
 * keyword match per category and normalizes the winner's score into a 0-1
 * confidence. Falls back to OTHER when nothing matches.
 */
export function classifyProblem(title: string, description: string): ClassificationResult {
  const text = `${title} ${description}`.toLowerCase();

  const scores = Object.fromEntries(PROBLEM_CATEGORIES.map((c) => [c, 0])) as Record<
    ProblemCategory,
    number
  >;
  const matchedKeywords: string[] = [];

  for (const category of PROBLEM_CATEGORIES) {
    for (const { word, weight } of CATEGORY_KEYWORDS[category]) {
      if (text.includes(word)) {
        scores[category] += weight;
        matchedKeywords.push(word);
      }
    }
  }

  const entries = Object.entries(scores) as [ProblemCategory, number][];
  const [topCategory, topScore] = entries.reduce((best, curr) => (curr[1] > best[1] ? curr : best));

  const totalScore = entries.reduce((sum, [, s]) => sum + s, 0);
  const confidence = totalScore > 0 ? Math.min(1, topScore / Math.max(totalScore, topScore + 2)) : 0;

  return {
    category: topScore > 0 ? topCategory : 'OTHER',
    confidence: topScore > 0 ? confidence : 0,
    matchedKeywords: [...new Set(matchedKeywords)],
    scores,
  };
}
