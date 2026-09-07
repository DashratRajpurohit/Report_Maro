import { Queue } from 'bullmq';
import {
  ANALYZE_PROBLEM_JOB,
  DEFAULT_JOB_OPTIONS,
  PROBLEM_ANALYSIS_QUEUE,
  type AnalyzeProblemJob,
} from '@sih/shared-types';
import { redisConnection } from './redis.js';

export const problemAnalysisQueue = new Queue<AnalyzeProblemJob>(PROBLEM_ANALYSIS_QUEUE, {
  connection: redisConnection,
});

export async function enqueueProblemAnalysis(job: AnalyzeProblemJob): Promise<void> {
  await problemAnalysisQueue.add(ANALYZE_PROBLEM_JOB, job, DEFAULT_JOB_OPTIONS);
}
