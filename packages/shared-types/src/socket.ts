import { z } from 'zod';
import { idSchema, isoDateSchema } from './common.js';
import {
  assignmentStatusSchema,
  prioritySchema,
  problemCategorySchema,
  problemStatusSchema,
  projectStatusSchema,
  proposalStatusSchema,
} from './enums.js';
import { notificationSchema } from './notification.js';

/**
 * Socket.io contract. The client authenticates in the handshake with
 * `auth: { token: <accessToken> }`; the server derives the rooms below from the
 * JWT, so a client can never subscribe to another role's stream.
 *
 * Owner: BE-2 (server) and FE-2 (client).
 */
export const SOCKET_EVENTS = {
  PROBLEM_CREATED: 'problem:created',
  PROBLEM_ANALYZED: 'problem:analyzed',
  PROBLEM_STATUS_CHANGED: 'problem:status_changed',
  ASSIGNMENT_CREATED: 'assignment:created',
  ASSIGNMENT_UPDATED: 'assignment:updated',
  PROPOSAL_SUBMITTED: 'proposal:submitted',
  PROPOSAL_REVIEWED: 'proposal:reviewed',
  PROJECT_CREATED: 'project:created',
  PROJECT_FUNDED: 'project:funded',
  PROJECT_STATUS_CHANGED: 'project:status_changed',
  NOTIFICATION_NEW: 'notification:new',
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

/** Client -> server. Only room joins; every mutation goes through the REST API. */
export const CLIENT_EVENTS = {
  SUBSCRIBE_PROBLEM: 'subscribe:problem',
  UNSUBSCRIBE_PROBLEM: 'unsubscribe:problem',
} as const;

/** Room naming. Import these helpers rather than building strings by hand. */
export const rooms = {
  user: (userId: string) => `user:${userId}`,
  role: (role: string) => `role:${role}`,
  organization: (organizationId: string) => `org:${organizationId}`,
  problem: (problemId: string) => `problem:${problemId}`,
} as const;

const baseEvent = { at: isoDateSchema };

export const problemCreatedEventSchema = z.object({
  ...baseEvent,
  problemId: idSchema,
  title: z.string(),
  district: z.string(),
  status: problemStatusSchema,
  latitude: z.number(),
  longitude: z.number(),
});
export type ProblemCreatedEvent = z.infer<typeof problemCreatedEventSchema>;

export const problemAnalyzedEventSchema = z.object({
  ...baseEvent,
  problemId: idSchema,
  title: z.string(),
  status: problemStatusSchema,
  category: problemCategorySchema,
  priority: prioritySchema,
  duplicateOfId: idSchema.nullable(),
});
export type ProblemAnalyzedEvent = z.infer<typeof problemAnalyzedEventSchema>;

export const problemStatusChangedEventSchema = z.object({
  ...baseEvent,
  problemId: idSchema,
  status: problemStatusSchema,
  previousStatus: problemStatusSchema,
});
export type ProblemStatusChangedEvent = z.infer<typeof problemStatusChangedEventSchema>;

export const assignmentCreatedEventSchema = z.object({
  ...baseEvent,
  assignmentId: idSchema,
  problemId: idSchema,
  problemTitle: z.string(),
  universityId: idSchema,
  universityName: z.string(),
});
export type AssignmentCreatedEvent = z.infer<typeof assignmentCreatedEventSchema>;

export const assignmentUpdatedEventSchema = z.object({
  ...baseEvent,
  assignmentId: idSchema,
  problemId: idSchema,
  status: assignmentStatusSchema,
});
export type AssignmentUpdatedEvent = z.infer<typeof assignmentUpdatedEventSchema>;

export const proposalSubmittedEventSchema = z.object({
  ...baseEvent,
  proposalId: idSchema,
  assignmentId: idSchema,
  problemId: idSchema,
  title: z.string(),
  universityName: z.string(),
  budgetInr: z.number(),
});
export type ProposalSubmittedEvent = z.infer<typeof proposalSubmittedEventSchema>;

export const proposalReviewedEventSchema = z.object({
  ...baseEvent,
  proposalId: idSchema,
  status: proposalStatusSchema,
  projectId: idSchema.nullable(),
});
export type ProposalReviewedEvent = z.infer<typeof proposalReviewedEventSchema>;

export const projectCreatedEventSchema = z.object({
  ...baseEvent,
  projectId: idSchema,
  title: z.string(),
  budgetInr: z.number(),
  category: problemCategorySchema.nullable(),
});
export type ProjectCreatedEvent = z.infer<typeof projectCreatedEventSchema>;

export const projectFundedEventSchema = z.object({
  ...baseEvent,
  projectId: idSchema,
  title: z.string(),
  amountInr: z.number(),
  fundedInr: z.number(),
  budgetInr: z.number(),
  fundedPercent: z.number(),
  industryName: z.string(),
  status: projectStatusSchema,
});
export type ProjectFundedEvent = z.infer<typeof projectFundedEventSchema>;

export const projectStatusChangedEventSchema = z.object({
  ...baseEvent,
  projectId: idSchema,
  status: projectStatusSchema,
});
export type ProjectStatusChangedEvent = z.infer<typeof projectStatusChangedEventSchema>;

export const notificationEventSchema = notificationSchema;
export type NotificationEvent = z.infer<typeof notificationEventSchema>;

/** Typed Socket.io map. `io.emit` and `socket.on` are checked against this. */
export interface ServerToClientEvents {
  'problem:created': (payload: ProblemCreatedEvent) => void;
  'problem:analyzed': (payload: ProblemAnalyzedEvent) => void;
  'problem:status_changed': (payload: ProblemStatusChangedEvent) => void;
  'assignment:created': (payload: AssignmentCreatedEvent) => void;
  'assignment:updated': (payload: AssignmentUpdatedEvent) => void;
  'proposal:submitted': (payload: ProposalSubmittedEvent) => void;
  'proposal:reviewed': (payload: ProposalReviewedEvent) => void;
  'project:created': (payload: ProjectCreatedEvent) => void;
  'project:funded': (payload: ProjectFundedEvent) => void;
  'project:status_changed': (payload: ProjectStatusChangedEvent) => void;
  'notification:new': (payload: NotificationEvent) => void;
}

export interface ClientToServerEvents {
  'subscribe:problem': (problemId: string) => void;
  'unsubscribe:problem': (problemId: string) => void;
}

/** Attached to each connected socket by the handshake middleware. */
export interface SocketData {
  userId: string;
  role: string;
  organizationId: string | null;
}
