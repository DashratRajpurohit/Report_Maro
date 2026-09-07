import { z } from 'zod';
import { idSchema, isoDateSchema } from './common.js';
import { organizationTypeSchema, userRoleSchema } from './enums.js';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[a-z]/, 'Password needs a lowercase letter')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/[0-9]/, 'Password needs a number');

/** Indian mobile number, optionally +91-prefixed. */
export const phoneSchema = z
  .string()
  .regex(/^(\+91[-\s]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

export const organizationSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
  type: organizationTypeSchema,
  district: z.string().nullable(),
});
export type OrganizationSummary = z.infer<typeof organizationSummarySchema>;

/** The user object returned everywhere. Never contains a password hash. */
export const publicUserSchema = z.object({
  id: idSchema,
  email: z.string().email(),
  name: z.string(),
  role: userRoleSchema,
  phone: z.string().nullable(),
  organization: organizationSummarySchema.nullable(),
  createdAt: isoDateSchema,
});
export type PublicUser = z.infer<typeof publicUserSchema>;

export const registerRequestSchema = z
  .object({
    email: z.string().email().toLowerCase().trim(),
    password: passwordSchema,
    name: z.string().min(2).max(120).trim(),
    phone: phoneSchema.optional(),
    /** Self-registration is limited to these three; ADMIN is seeded only. */
    role: z.enum(['CITIZEN', 'UNIVERSITY', 'INDUSTRY']).default('CITIZEN'),
    /** Required when role is UNIVERSITY or INDUSTRY. */
    organizationId: idSchema.optional(),
  })
  .refine((v) => v.role === 'CITIZEN' || Boolean(v.organizationId), {
    message: 'organizationId is required for UNIVERSITY and INDUSTRY accounts',
    path: ['organizationId'],
  });
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

/**
 * `accessToken` is a short-lived JWT for the `Authorization: Bearer` header and
 * for the Socket.io handshake. `refreshToken` is long-lived and only ever sent
 * to POST /auth/refresh.
 */
export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

export const authResponseSchema = z.object({
  user: publicUserSchema,
  tokens: authTokensSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const refreshRequestSchema = z.object({ refreshToken: z.string().min(1) });
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

export const logoutRequestSchema = z.object({ refreshToken: z.string().min(1) });
export type LogoutRequest = z.infer<typeof logoutRequestSchema>;

/** Decoded access-token payload; `req.user` on the API side. */
export const jwtPayloadSchema = z.object({
  sub: idSchema,
  email: z.string().email(),
  role: userRoleSchema,
  organizationId: idSchema.nullable(),
});
export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
