import { z } from 'zod';
import { idSchema, isoDateSchema, paginationQuerySchema } from './common.js';
import { proposalStatusSchema } from './enums.js';
import { organizationSummarySchema } from './auth.js';
import { problemSummarySchema } from './problem.js';

export const teamMemberSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  /** Degree + year, e.g. "B.Tech CSE, 3rd year". */
  role: z.string().min(2).max(120).trim(),
  email: z.string().email().optional(),
});
export type TeamMember = z.infer<typeof teamMemberSchema>;

export const proposalSchema = z.object({
  id: idSchema,
  assignmentId: idSchema,
  problem: problemSummarySchema,
  university: organizationSummarySchema,
  title: z.string(),
  summary: z.string(),
  approach: z.string(),
  teamMembers: z.array(teamMemberSchema),
  /** Whole rupees. The UI formats with the en-IN locale. */
  budgetInr: z.number().int().nonnegative(),
  timelineWeeks: z.number().int().positive(),
  status: proposalStatusSchema,
  reviewNote: z.string().nullable(),
  reviewedAt: isoDateSchema.nullable(),
  projectId: idSchema.nullable(),
  submittedBy: z.object({ id: idSchema, name: z.string() }),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type Proposal = z.infer<typeof proposalSchema>;

export const createProposalRequestSchema = z.object({
  assignmentId: idSchema,
  title: z.string().min(10).max(160).trim(),
  summary: z.string().min(50, 'Summarise the solution in at least 50 characters').max(2000).trim(),
  approach: z.string().min(50).max(6000).trim(),
  teamMembers: z.array(teamMemberSchema).min(1, 'Add at least one team member').max(12),
  budgetInr: z.number().int().min(0).max(100_000_000),
  timelineWeeks: z.number().int().min(1).max(104),
  /** DRAFT keeps it private to the university; SUBMITTED notifies the admin. */
  status: z.enum(['DRAFT', 'SUBMITTED']).default('SUBMITTED'),
});
export type CreateProposalRequest = z.infer<typeof createProposalRequestSchema>;

export const updateProposalRequestSchema = createProposalRequestSchema
  .omit({ assignmentId: true })
  .partial();
export type UpdateProposalRequest = z.infer<typeof updateProposalRequestSchema>;

/** Admin review. APPROVED spawns a Project in AWAITING_FUNDING. */
export const reviewProposalRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().max(1000).trim().optional(),
});
export type ReviewProposalRequest = z.infer<typeof reviewProposalRequestSchema>;

export const listProposalsQuerySchema = paginationQuerySchema.extend({
  status: proposalStatusSchema.optional(),
  assignmentId: idSchema.optional(),
  universityId: idSchema.optional(),
  mine: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => v === true || v === 'true')
    .optional(),
});
export type ListProposalsQuery = z.infer<typeof listProposalsQuerySchema>;
