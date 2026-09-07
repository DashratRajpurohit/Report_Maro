import { z } from 'zod';
import { idSchema, isoDateSchema, paginationQuerySchema } from './common.js';
import { assignmentStatusSchema } from './enums.js';
import { organizationSummarySchema } from './auth.js';
import { problemSummarySchema } from './problem.js';

export const assignmentSchema = z.object({
  id: idSchema,
  problemId: idSchema,
  problem: problemSummarySchema,
  university: organizationSummarySchema,
  status: assignmentStatusSchema,
  note: z.string().nullable(),
  dueDate: isoDateSchema.nullable(),
  assignedBy: z.object({ id: idSchema, name: z.string() }),
  /** Set once the university responds; null while PENDING. */
  respondedAt: isoDateSchema.nullable(),
  proposalId: idSchema.nullable(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const createAssignmentRequestSchema = z.object({
  problemId: idSchema,
  /** Organization id with type UNIVERSITY -- see GET /organizations?type=UNIVERSITY. */
  universityId: idSchema,
  note: z.string().max(1000).trim().optional(),
  dueDate: isoDateSchema.optional(),
});
export type CreateAssignmentRequest = z.infer<typeof createAssignmentRequestSchema>;

/** University accepts or declines; declining frees the problem for re-assignment. */
export const respondToAssignmentRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED', 'COMPLETED']),
  reason: z.string().max(500).trim().optional(),
});
export type RespondToAssignmentRequest = z.infer<typeof respondToAssignmentRequestSchema>;

export const listAssignmentsQuerySchema = paginationQuerySchema.extend({
  status: assignmentStatusSchema.optional(),
  universityId: idSchema.optional(),
  problemId: idSchema.optional(),
  /** UNIVERSITY callers use this to scope to their own organization. */
  mine: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => v === true || v === 'true')
    .optional(),
});
export type ListAssignmentsQuery = z.infer<typeof listAssignmentsQuerySchema>;
