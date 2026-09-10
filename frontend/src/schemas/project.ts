import { z } from 'zod';
import { idSchema } from './common.js';
import { projectStatusSchema } from './enums.js';

const milestoneSchema = z.object({
  title: z.string(),
  dueDate: z.string(),
  done: z.boolean().default(false),
});
export type Milestone = z.infer<typeof milestoneSchema>;

export const projectSchema = z.object({
  _id: idSchema,
  problem_id: idSchema,
  university_id: idSchema,
  industry_partner_id: idSchema.nullable(),
  proposal_text: z.string(),
  status: projectStatusSchema,
  budget: z.number().nullable(),
  milestones: z.array(milestoneSchema),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Project = z.infer<typeof projectSchema>;

export const submitProposalRequestSchema = z.object({
  proposal_text: z.string().min(20, 'Describe your proposed solution').trim(),
  budget: z.number().positive('Budget must be greater than zero'),
  milestones: z.array(milestoneSchema).optional().default([]),
});
export type SubmitProposalRequest = z.infer<typeof submitProposalRequestSchema>;

export const fundProjectRequestSchema = z.object({
  amount: z.number().positive('Funding amount must be greater than zero'),
});
export type FundProjectRequest = z.infer<typeof fundProjectRequestSchema>;

/**
 * GET /api/projects and GET /api/projects/:id -- additive endpoints
 * (backend/src/controllers/project.controller.js), added alongside this
 * frontend because PRs #4-#9 only ship POST .../proposal and PUT .../fund;
 * nothing lets a university see its own projects or an industry browse
 * fundable ones. See docs/API_CONTRACT.md.
 */
export const listProjectsQuerySchema = z.object({
  status: projectStatusSchema.optional(),
  university_id: idSchema.optional(),
});
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

export const listProjectsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(projectSchema),
});
export type ListProjectsResponse = z.infer<typeof listProjectsResponseSchema>;
