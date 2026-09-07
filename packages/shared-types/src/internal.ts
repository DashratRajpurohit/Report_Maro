import { z } from 'zod';
import { idSchema, isoDateSchema } from './common.js';
import { districtSchema, prioritySchema, problemCategorySchema } from './enums.js';

/**
 * The Internal API is the only surface the AI worker talks to. It is mounted at
 * /api/v1/internal, never exposed through the browser, and authenticated with
 * the `x-internal-key` header (INTERNAL_API_SECRET), not a JWT.
 *
 * Owner: BE-2 (server side) and AI-2 (client side).
 */
export const INTERNAL_API_KEY_HEADER = 'x-internal-key';

/** Embedding width. Changing this requires a Postgres migration on pgvector. */
export const EMBEDDING_DIMENSIONS = 384;

export const embeddingSchema = z
  .array(z.number().finite())
  .length(EMBEDDING_DIMENSIONS, `Embedding must have exactly ${EMBEDDING_DIMENSIONS} dimensions`);
export type Embedding = z.infer<typeof embeddingSchema>;

/**
 * Similarity search. The worker owns the embedding maths; Postgres/pgvector
 * stays behind the API so the worker needs no database credentials.
 */
export const similaritySearchRequestSchema = z.object({
  embedding: embeddingSchema,
  /** Exclude the problem being analysed from its own candidate list. */
  excludeProblemId: idSchema.optional(),
  /** Only compare against problems in the same district. */
  district: districtSchema.optional(),
  limit: z.number().int().positive().max(20).default(5),
  /** Cosine similarity floor, 0-1. */
  minScore: z.number().min(0).max(1).default(0.8),
});
export type SimilaritySearchRequest = z.infer<typeof similaritySearchRequestSchema>;

export const similarityCandidateSchema = z.object({
  problemId: idSchema,
  title: z.string(),
  score: z.number().min(0).max(1),
  status: z.string(),
  createdAt: isoDateSchema,
});
export type SimilarityCandidate = z.infer<typeof similarityCandidateSchema>;

export const similaritySearchResponseSchema = z.object({
  candidates: z.array(similarityCandidateSchema),
});
export type SimilaritySearchResponse = z.infer<typeof similaritySearchResponseSchema>;

/**
 * The analysis callback -- the single write the worker makes. It is idempotent:
 * replaying the same payload for the same problem must not create duplicate
 * notifications or double-count anything.
 */
export const analysisCallbackRequestSchema = z.object({
  category: problemCategorySchema,
  categoryConfidence: z.number().min(0).max(1),
  priority: prioritySchema,
  priorityScore: z.number().min(0).max(100),
  keywords: z.array(z.string().max(60)).max(20).default([]),
  embedding: embeddingSchema,
  /** Set when dedupe matched; the API then flips status to DUPLICATE. */
  duplicateOfId: idSchema.nullable().default(null),
  similarityScore: z.number().min(0).max(1).nullable().default(null),
  model: z.string().min(1).max(80),
  processingMs: z.number().int().nonnegative(),
});
export type AnalysisCallbackRequest = z.infer<typeof analysisCallbackRequestSchema>;

export const analysisCallbackResponseSchema = z.object({
  problemId: idSchema,
  status: z.string(),
  /** false when the callback was a replay and nothing changed. */
  applied: z.boolean(),
});
export type AnalysisCallbackResponse = z.infer<typeof analysisCallbackResponseSchema>;

/** Reported after BullMQ exhausts its retries, so the problem does not hang. */
export const analysisFailureRequestSchema = z.object({
  reason: z.string().min(1).max(1000),
  attempts: z.number().int().positive(),
  /** Truncated to keep the payload small; the full trace stays in worker logs. */
  stack: z.string().max(4000).optional(),
});
export type AnalysisFailureRequest = z.infer<typeof analysisFailureRequestSchema>;
