import type { Priority, ProblemCategory } from '@sih/shared-types';
import { URGENCY_KEYWORDS } from './taxonomy.js';

/** Categories that default to a higher baseline urgency regardless of wording. */
const CATEGORY_BASELINE: Record<ProblemCategory, number> = {
  HEALTHCARE: 30,
  WATER_SANITATION: 25,
  PUBLIC_SAFETY: 25,
  ROADS_TRANSPORT: 20,
  ELECTRICITY: 15,
  EDUCATION: 10,
  WASTE_MANAGEMENT: 10,
  AGRICULTURE: 10,
  OTHER: 5,
};

export interface PriorityResult {
  priority: Priority;
  score: number;
}

function scoreToPriority(score: number): Priority {
  if (score >= 80) return 'CRITICAL';
  if (score >= 55) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

/**
 * 0-100 rule-based priority score: a category baseline plus urgency-keyword
 * hits plus a small boost for a longer, more detailed report (a signal the
 * reporter is describing a real, specific problem rather than a one-liner).
 */
export function scorePriority(
  title: string,
  description: string,
  category: ProblemCategory,
): PriorityResult {
  const text = `${title} ${description}`.toLowerCase();

  let score = CATEGORY_BASELINE[category];

  for (const keyword of URGENCY_KEYWORDS) {
    if (text.includes(keyword)) score += 15;
  }

  if (description.length > 300) score += 10;
  else if (description.length > 150) score += 5;

  score = Math.max(0, Math.min(100, score));

  return { priority: scoreToPriority(score), score };
}
