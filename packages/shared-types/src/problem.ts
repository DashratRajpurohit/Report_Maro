import { z } from 'zod';
import {
  bboxQuerySchema,
  idSchema,
  isoDateSchema,
  latitudeSchema,
  longitudeSchema,
  paginationQuerySchema,
} from './common.js';
import {
  districtSchema,
  prioritySchema,
  problemCategorySchema,
  problemStatusSchema,
} from './enums.js';

export const locationSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  district: districtSchema,
  /** Free-text landmark: "near Birsa Chowk, ward 12". */
  address: z.string().max(300).trim().optional(),
});
export type ProblemLocation = z.infer<typeof locationSchema>;

/** Photos are uploaded to object storage first; the API only stores keys. */
export const photoSchema = z.object({
  key: z.string().min(1).max(300),
  url: z.string().url(),
});
export type ProblemPhoto = z.infer<typeof photoSchema>;

/**
 * What the AI worker wrote back. `null` until the analysis callback lands, so
 * the UI must render a "Analysing..." state rather than assuming a category.
 */
export const problemAnalysisSchema = z.object({
  category: problemCategorySchema,
  categoryConfidence: z.number().min(0).max(1),
  priority: prioritySchema,
  priorityScore: z.number().min(0).max(100),
  keywords: z.array(z.string()).max(20),
  duplicateOfId: idSchema.nullable(),
  similarityScore: z.number().min(0).max(1).nullable(),
  /** e.g. "rules@1.2.0" or "gpt-4o-mini" -- lets us A/B the classifier later. */
  model: z.string(),
  analyzedAt: isoDateSchema,
});
export type ProblemAnalysis = z.infer<typeof problemAnalysisSchema>;

export const problemReporterSchema = z.object({
  id: idSchema,
  name: z.string(),
});

export const problemSchema = z.object({
  id: idSchema,
  title: z.string(),
  description: z.string(),
  status: problemStatusSchema,
  location: locationSchema,
  photos: z.array(photoSchema),
  reporter: problemReporterSchema,
  analysis: problemAnalysisSchema.nullable(),
  /** Denormalised for list/map rendering; mirrors `analysis` once triaged. */
  category: problemCategorySchema.nullable(),
  priority: prioritySchema.nullable(),
  duplicateCount: z.number().int().nonnegative(),
  assignmentId: idSchema.nullable(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type Problem = z.infer<typeof problemSchema>;

/** Trimmed shape used by the map layer and list cards -- keeps payloads small. */
export const problemSummarySchema = problemSchema.omit({
  description: true,
  analysis: true,
  photos: true,
});
export type ProblemSummary = z.infer<typeof problemSummarySchema>;

export const createProblemRequestSchema = z.object({
  title: z.string().min(10, 'Give the problem a clear title').max(160).trim(),
  description: z.string().min(30, 'Describe the problem in at least 30 characters').max(4000).trim(),
  location: locationSchema,
  photos: z.array(photoSchema).max(5).default([]),
  /** Optional citizen hint; the AI still classifies and may disagree. */
  suggestedCategory: problemCategorySchema.optional(),
});
export type CreateProblemRequest = z.infer<typeof createProblemRequestSchema>;

export const listProblemsQuerySchema = paginationQuerySchema.extend({
  status: problemStatusSchema.optional(),
  category: problemCategorySchema.optional(),
  priority: prioritySchema.optional(),
  district: districtSchema.optional(),
  /** Full-text search over title + description. */
  q: z.string().max(200).trim().optional(),
  /** `true` restricts the list to the caller's own submissions. */
  mine: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => v === true || v === 'true')
    .optional(),
  bbox: bboxQuerySchema.optional(),
  sort: z.enum(['newest', 'oldest', 'priority']).default('newest'),
});
export type ListProblemsQuery = z.infer<typeof listProblemsQuerySchema>;

/** Admin-only status override (e.g. marking spam REJECTED). */
export const updateProblemStatusRequestSchema = z.object({
  status: problemStatusSchema,
  note: z.string().max(500).trim().optional(),
});
export type UpdateProblemStatusRequest = z.infer<typeof updateProblemStatusRequestSchema>;
