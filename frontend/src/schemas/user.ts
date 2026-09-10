import { z } from 'zod';
import { idSchema } from './common.js';
import { userRoleSchema } from './enums.js';

/** Matches backend/src/models/user.model.js exactly (password_hash never sent to the client). */
export const userSchema = z.object({
  id: idSchema,
  full_name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  organization: z.string().nullable(),
});
export type User = z.infer<typeof userSchema>;

export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export const registerRequestSchema = z.object({
  full_name: z.string().min(2, 'Full name is required').trim(),
  email: z.string().email().toLowerCase().trim(),
  password: passwordSchema,
  role: userRoleSchema.default('citizen'),
  /** Free-text org name today (backend/src/models/user.model.js has no Organization collection). */
  organization: z.string().trim().optional(),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

/** POST /api/auth/register and /login both return this exact envelope (a single JWT, not a token pair). */
export const authResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  token: z.string(),
  user: userSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

/**
 * GET /api/users?role=university -- additive endpoint (backend/src/routes/user.route.js),
 * added alongside this frontend because nothing in PRs #4-#9 lets an admin
 * discover which users to assign a problem to. See docs/API_CONTRACT.md.
 */
export const listUsersQuerySchema = z.object({
  role: userRoleSchema.optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const listUsersResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(userSchema),
});
export type ListUsersResponse = z.infer<typeof listUsersResponseSchema>;
