import { z } from 'zod';
import { idSchema, isoDateSchema } from './common.js';
import { districtSchema, problemCategorySchema } from './enums.js';

/**
 * BullMQ contract between apps/api (producer, BE-2) and apps/ai-worker
 * (consumer, AI-1). Both sides import these constants -- no string literals.
 */
export const PROBLEM_ANALYSIS_QUEUE = 'problem-analysis';
export const ANALYZE_PROBLEM_JOB = 'analyze-problem';

export const analyzeProblemJobSchema = z.object({
  problemId: idSchema,
  title: z.string(),
  description: z.string(),
  district: districtSchema,
  latitude: z.number(),
  longitude: z.number(),
  /** Citizen's optional hint; the classifier treats it as a weak signal only. */
  suggestedCategory: problemCategorySchema.optional(),
  submittedAt: isoDateSchema,
});
export type AnalyzeProblemJob = z.infer<typeof analyzeProblemJobSchema>;

/** Shared retry/backoff policy so producer and worker never disagree. */
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 86_400 },
} as const;
