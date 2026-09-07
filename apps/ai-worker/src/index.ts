import { Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import {
  ANALYZE_PROBLEM_JOB,
  PROBLEM_ANALYSIS_QUEUE,
  type AnalyzeProblemJob,
  type AnalysisCallbackRequest,
} from '@sih/shared-types';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { internalApiClient } from './lib/internalApiClient.js';
import { classifyProblem } from './pipeline/classifier.js';
import { classifyWithOpenAiFallback } from './pipeline/openaiFallback.js';
import { scorePriority } from './pipeline/priorityScorer.js';
import { embedText } from './pipeline/embeddings.js';
import { findDuplicate } from './pipeline/dedupe.js';

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

async function processJob(job: Job<AnalyzeProblemJob>): Promise<void> {
  const start = Date.now();
  const { problemId, title, description, district } = job.data;

  let classification = classifyProblem(title, description);
  let model = 'rules@1.0.0';

  if (classification.confidence < env.CLASSIFIER_CONFIDENCE_FALLBACK_THRESHOLD) {
    const fallback = await classifyWithOpenAiFallback(title, description);
    if (fallback) {
      classification = { ...classification, category: fallback.category, confidence: fallback.confidence };
      model = env.OPENAI_MODEL;
    }
  }

  const { priority, score: priorityScore } = scorePriority(title, description, classification.category);
  const embedding = await embedText(`${title}. ${description}`);
  const dedupe = await findDuplicate(embedding, problemId, district);

  const payload: AnalysisCallbackRequest = {
    category: classification.category,
    categoryConfidence: classification.confidence,
    priority,
    priorityScore,
    keywords: classification.matchedKeywords,
    embedding,
    duplicateOfId: dedupe.duplicateOfId,
    similarityScore: dedupe.similarityScore,
    model,
    processingMs: Date.now() - start,
  };

  await internalApiClient.postAnalysis(problemId, payload);
  logger.info({ problemId, category: payload.category, priority: payload.priority }, 'analysis complete');
}

const worker = new Worker<AnalyzeProblemJob>(
  PROBLEM_ANALYSIS_QUEUE,
  async (job) => {
    if (job.name !== ANALYZE_PROBLEM_JOB) return;
    await processJob(job);
  },
  { connection, concurrency: 4 },
);

worker.on('completed', (job) => logger.debug({ jobId: job.id }, 'job completed'));

worker.on('failed', async (job, err) => {
  logger.error({ jobId: job?.id, err }, 'job failed');
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    try {
      await internalApiClient.postFailure(job.data.problemId, {
        reason: err.message,
        attempts: job.attemptsMade,
        stack: err.stack?.slice(0, 4000),
      });
    } catch (reportErr) {
      logger.error({ reportErr }, 'failed to report permanent failure to the API');
    }
  }
});

logger.info(`AI worker listening on queue "${PROBLEM_ANALYSIS_QUEUE}"`);
