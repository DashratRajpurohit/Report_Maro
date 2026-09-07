import { z } from 'zod';

/**
 * Every enum in the system lives here. Postgres enums (prisma/schema.prisma),
 * the API contract (docs/API_CONTRACT.md) and the web UI all derive from these
 * exact string values -- never redeclare them locally.
 */

export const UserRole = {
  CITIZEN: 'CITIZEN',
  ADMIN: 'ADMIN',
  UNIVERSITY: 'UNIVERSITY',
  INDUSTRY: 'INDUSTRY',
} as const;
export const userRoleSchema = z.enum(['CITIZEN', 'ADMIN', 'UNIVERSITY', 'INDUSTRY']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const organizationTypeSchema = z.enum(['UNIVERSITY', 'INDUSTRY', 'GOVERNMENT']);
export type OrganizationType = z.infer<typeof organizationTypeSchema>;

/** AI classifier output space. Keep in sync with apps/ai-worker/src/pipeline/taxonomy.ts. */
export const problemCategorySchema = z.enum([
  'WATER_SANITATION',
  'ROADS_TRANSPORT',
  'EDUCATION',
  'HEALTHCARE',
  'ELECTRICITY',
  'WASTE_MANAGEMENT',
  'AGRICULTURE',
  'PUBLIC_SAFETY',
  'OTHER',
]);
export type ProblemCategory = z.infer<typeof problemCategorySchema>;

export const PROBLEM_CATEGORIES = problemCategorySchema.options;

/** Human labels for dashboards; the API never sends these, the UI renders them. */
export const PROBLEM_CATEGORY_LABELS: Record<ProblemCategory, string> = {
  WATER_SANITATION: 'Water & Sanitation',
  ROADS_TRANSPORT: 'Roads & Transport',
  EDUCATION: 'Education',
  HEALTHCARE: 'Healthcare',
  ELECTRICITY: 'Electricity',
  WASTE_MANAGEMENT: 'Waste Management',
  AGRICULTURE: 'Agriculture',
  PUBLIC_SAFETY: 'Public Safety',
  OTHER: 'Other',
};

export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type Priority = z.infer<typeof prioritySchema>;

/**
 * Problem lifecycle.
 *   SUBMITTED   -> citizen posted it, queued for AI
 *   PROCESSING  -> worker picked the job up
 *   TRIAGED     -> AI wrote category/priority back, waiting for an admin
 *   DUPLICATE   -> AI matched it to an existing problem
 *   ASSIGNED    -> admin routed it to a university
 *   IN_PROGRESS -> a funded project is working on it
 *   RESOLVED    -> done
 *   REJECTED    -> spam / out of scope
 */
export const problemStatusSchema = z.enum([
  'SUBMITTED',
  'PROCESSING',
  'TRIAGED',
  'DUPLICATE',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED',
]);
export type ProblemStatus = z.infer<typeof problemStatusSchema>;

export const assignmentStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED']);
export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>;

export const proposalStatusSchema = z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']);
export type ProposalStatus = z.infer<typeof proposalStatusSchema>;

export const projectStatusSchema = z.enum([
  'AWAITING_FUNDING',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const notificationTypeSchema = z.enum([
  'PROBLEM_ANALYZED',
  'PROBLEM_ASSIGNED',
  'PROBLEM_STATUS_CHANGED',
  'PROPOSAL_SUBMITTED',
  'PROPOSAL_REVIEWED',
  'PROJECT_FUNDED',
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

/** The 24 districts of Jharkhand -- the only values the location picker accepts. */
export const JHARKHAND_DISTRICTS = [
  'Bokaro',
  'Chatra',
  'Deoghar',
  'Dhanbad',
  'Dumka',
  'East Singhbhum',
  'Garhwa',
  'Giridih',
  'Godda',
  'Gumla',
  'Hazaribagh',
  'Jamtara',
  'Khunti',
  'Koderma',
  'Latehar',
  'Lohardaga',
  'Pakur',
  'Palamu',
  'Ramgarh',
  'Ranchi',
  'Sahibganj',
  'Seraikela-Kharsawan',
  'Simdega',
  'West Singhbhum',
] as const;

export const districtSchema = z.enum(JHARKHAND_DISTRICTS);
export type District = z.infer<typeof districtSchema>;
