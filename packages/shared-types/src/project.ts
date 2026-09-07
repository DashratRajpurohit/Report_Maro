import { z } from 'zod';
import { idSchema, isoDateSchema, paginationQuerySchema } from './common.js';
import { problemCategorySchema, projectStatusSchema } from './enums.js';
import { organizationSummarySchema } from './auth.js';
import { problemSummarySchema } from './problem.js';

export const fundingSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  industry: organizationSummarySchema,
  amountInr: z.number().int().positive(),
  note: z.string().nullable(),
  /** Demo build records a pledge; no payment gateway is wired up. */
  fundedBy: z.object({ id: idSchema, name: z.string() }),
  createdAt: isoDateSchema,
});
export type Funding = z.infer<typeof fundingSchema>;

export const projectSchema = z.object({
  id: idSchema,
  proposalId: idSchema,
  problem: problemSummarySchema,
  university: organizationSummarySchema,
  title: z.string(),
  summary: z.string(),
  category: problemCategorySchema.nullable(),
  status: projectStatusSchema,
  budgetInr: z.number().int().nonnegative(),
  fundedInr: z.number().int().nonnegative(),
  /** 0-100, clamped. Convenience for progress bars. */
  fundedPercent: z.number().min(0).max(100),
  timelineWeeks: z.number().int().positive(),
  fundings: z.array(fundingSchema),
  startedAt: isoDateSchema.nullable(),
  completedAt: isoDateSchema.nullable(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type Project = z.infer<typeof projectSchema>;

export const projectSummarySchema = projectSchema.omit({ fundings: true, summary: true });
export type ProjectSummary = z.infer<typeof projectSummarySchema>;

export const createFundingRequestSchema = z.object({
  amountInr: z.number().int().positive('Pledge must be greater than zero').max(100_000_000),
  note: z.string().max(500).trim().optional(),
});
export type CreateFundingRequest = z.infer<typeof createFundingRequestSchema>;

export const listProjectsQuerySchema = paginationQuerySchema.extend({
  status: projectStatusSchema.optional(),
  category: problemCategorySchema.optional(),
  universityId: idSchema.optional(),
  /** INDUSTRY callers: only projects their organization has funded. */
  fundedByMe: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => v === true || v === 'true')
    .optional(),
});
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

/** University marks delivery; admin can cancel. */
export const updateProjectStatusRequestSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']),
  note: z.string().max(500).trim().optional(),
});
export type UpdateProjectStatusRequest = z.infer<typeof updateProjectStatusRequestSchema>;
