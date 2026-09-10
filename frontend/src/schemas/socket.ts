import { z } from 'zod';
import { idSchema } from './common.js';
import { problemCategorySchema, prioritySchema } from './enums.js';

/**
 * Event names and room-naming already referenced via `req.app.get('io')` in
 * backend/src/controllers/{internal,problem,project}.controller.js -- they
 * just had nothing on the other end setting `io` on the app or authenticating
 * a socket connection until this PR's backend/src/index.js change. Payload
 * shapes below are taken directly from those `.emit()` calls.
 */
export const SOCKET_EVENTS = {
  PROBLEM_VERIFIED: 'problem_verified',
  PROBLEM_ASSIGNED: 'problem_assigned',
  NEW_PROPOSAL: 'new_proposal',
  PROJECT_FUNDED: 'project_funded',
  PROJECT_ACTIVE: 'project_active',
} as const;

export const rooms = {
  admins: () => 'admins',
  industry: () => 'industry',
  university: (universityId: string) => `university_${universityId}`,
} as const;

export const problemVerifiedEventSchema = z.object({
  problemId: idSchema,
  title: z.string(),
  category: problemCategorySchema.nullable(),
  priority: prioritySchema,
});
export type ProblemVerifiedEvent = z.infer<typeof problemVerifiedEventSchema>;

export const problemAssignedEventSchema = z.object({
  problemId: idSchema,
  title: z.string(),
  category: problemCategorySchema.nullable(),
});
export type ProblemAssignedEvent = z.infer<typeof problemAssignedEventSchema>;

export const newProposalEventSchema = z.object({
  projectId: idSchema,
  problemId: idSchema,
  budget: z.number(),
});
export type NewProposalEvent = z.infer<typeof newProposalEventSchema>;

export const projectFundedEventSchema = z.object({
  projectId: idSchema,
  amount: z.number(),
});
export type ProjectFundedEvent = z.infer<typeof projectFundedEventSchema>;

export const projectActiveEventSchema = z.object({
  projectId: idSchema,
  amount: z.number(),
});
export type ProjectActiveEvent = z.infer<typeof projectActiveEventSchema>;

export interface ServerToClientEvents {
  problem_verified: (payload: ProblemVerifiedEvent) => void;
  problem_assigned: (payload: ProblemAssignedEvent) => void;
  new_proposal: (payload: NewProposalEvent) => void;
  project_funded: (payload: ProjectFundedEvent) => void;
  project_active: (payload: ProjectActiveEvent) => void;
}
