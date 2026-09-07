import type { SimilarityCandidate } from '@sih/shared-types';
import { env } from '../config/env.js';
import { internalApiClient } from '../lib/internalApiClient.js';

export interface DedupeResult {
  duplicateOfId: string | null;
  similarityScore: number | null;
  candidates: SimilarityCandidate[];
}

/**
 * Asks the API's pgvector index for near neighbours (the worker never talks
 * to Postgres directly — see docs/API_CONTRACT.md#the-internal-api). The top
 * candidate above DEDUPE_MIN_SCORE, if any, becomes the duplicate link.
 */
export async function findDuplicate(
  embedding: number[],
  problemId: string,
  district: string,
): Promise<DedupeResult> {
  const { candidates } = await internalApiClient.searchSimilar({
    embedding,
    excludeProblemId: problemId,
    district: district as never,
    limit: 5,
    minScore: env.DEDUPE_MIN_SCORE,
  });

  const best = candidates[0];
  return {
    duplicateOfId: best ? best.problemId : null,
    similarityScore: best ? best.score : null,
    candidates,
  };
}
