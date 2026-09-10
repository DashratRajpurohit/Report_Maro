import { z } from 'zod';
import { idSchema, paginationSchema } from './common.js';
import { problemCategorySchema, problemStatusSchema, prioritySchema } from './enums.js';

/** Matches backend/src/models/problem.model.js's embedded location subdocument exactly. */
export const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  district: z.string().min(1, 'District is required'),
  address: z.string().optional().default(''),
});
export type Location = z.infer<typeof locationSchema>;

const populatedRef = z.object({ full_name: z.string().optional(), email: z.string().optional(), organization: z.string().optional() });

export const problemSchema = z.object({
  _id: idSchema,
  title: z.string(),
  description: z.string(),
  category: problemCategorySchema.nullable(),
  priority: prioritySchema,
  status: problemStatusSchema,
  location: locationSchema,
  image_urls: z.array(z.string()),
  /** GET list/detail populate() these into objects; POST create only returns the raw id. */
  submitted_by: z.union([idSchema, populatedRef]),
  assigned_university: z.union([idSchema, populatedRef]).nullable(),
  ai_confidence: z.number().min(0).max(1).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Problem = z.infer<typeof problemSchema>;

export const createProblemRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').trim(),
  description: z.string().min(20, 'Description must be at least 20 characters').trim(),
  location: locationSchema,
  image_urls: z.array(z.string()).optional().default([]),
});
export type CreateProblemRequest = z.infer<typeof createProblemRequestSchema>;

/** POST /api/problems responds 202 with this trimmed shape, not the full Problem. */
export const createProblemResponseSchema = z.object({
  id: idSchema,
  title: z.string(),
  status: problemStatusSchema,
  created_at: z.string(),
});
export type CreateProblemResponse = z.infer<typeof createProblemResponseSchema>;

export const listProblemsQuerySchema = z.object({
  category: problemCategorySchema.optional(),
  district: z.string().optional(),
  status: problemStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
export type ListProblemsQuery = z.infer<typeof listProblemsQuerySchema>;

export const listProblemsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(problemSchema),
  pagination: paginationSchema,
});
export type ListProblemsResponse = z.infer<typeof listProblemsResponseSchema>;

export const assignProblemRequestSchema = z.object({ universityId: idSchema });
export type AssignProblemRequest = z.infer<typeof assignProblemRequestSchema>;

/** GET /api/problems/stats/dashboard (admin-only, Redis-cached 5 min). */
export const statsOverviewSchema = z.object({
  success: z.literal(true),
  source: z.enum(['cache', 'database']),
  data: z.object({
    total: z.number(),
    byCategory: z.array(z.object({ _id: problemCategorySchema.nullable(), count: z.number() })),
    byStatus: z.array(z.object({ _id: problemStatusSchema, count: z.number() })),
    byDistrict: z.array(z.object({ _id: z.string(), count: z.number() })),
    lastUpdated: z.string(),
  }),
});
export type StatsOverview = z.infer<typeof statsOverviewSchema>;
