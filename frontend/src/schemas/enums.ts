import { z } from 'zod';

/**
 * These values are load-bearing: they're the literal strings backend/'s
 * Mongoose enums accept (see backend/src/models/*.model.js). Keep in sync —
 * if a teammate adds a value on the Mongoose side, add it here too.
 */
export const userRoleSchema = z.enum(['citizen', 'admin', 'university', 'industry']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const problemCategorySchema = z.enum(['water', 'road', 'health', 'other']);
export type ProblemCategory = z.infer<typeof problemCategorySchema>;
export const PROBLEM_CATEGORIES = problemCategorySchema.options;

export const PROBLEM_CATEGORY_LABELS: Record<ProblemCategory, string> = {
  water: 'Water & Sanitation',
  road: 'Roads & Transport',
  health: 'Healthcare',
  other: 'Other',
};

export const prioritySchema = z.enum(['low', 'medium', 'high']);
export type Priority = z.infer<typeof prioritySchema>;

/** See backend/src/models/problem.model.js — no REJECTED/DUPLICATE state exists yet. */
export const problemStatusSchema = z.enum(['submitted', 'verified', 'assigned', 'in_progress', 'resolved']);
export type ProblemStatus = z.infer<typeof problemStatusSchema>;

/** See backend/src/models/project.model.js. */
export const projectStatusSchema = z.enum(['proposed', 'under_review', 'active', 'completed']);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const notificationTypeSchema = z.enum(['assignment', 'status_update', 'funding', 'mention']);
export type NotificationType = z.infer<typeof notificationTypeSchema>;
