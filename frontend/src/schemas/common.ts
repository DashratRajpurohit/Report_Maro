import { z } from 'zod';

/** Mongoose ObjectId, serialized as a 24-char hex string over the wire. */
export const idSchema = z.string().length(24);

/**
 * backend/'s error shapes are not fully consistent yet: most controllers
 * catch-and-respond with `{ success: false, message }` directly, while the
 * global errorHandler middleware (uncaught errors) responds with
 * `{ success: false, error: { code, message } }`. This type covers both so
 * the frontend never crashes on either shape — see apiErrorMessage() in
 * apps/web/src/lib/apiClient.ts for the single place that unwraps it.
 */
export const apiErrorSchema = z.object({
  success: z.literal(false),
  message: z.string().optional(),
  error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
});
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;

/** GET /api/problems and similar list endpoints return this exact shape (not a `meta` wrapper). */
export const paginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  pages: z.number().int().nonnegative(),
});
export type Pagination = z.infer<typeof paginationSchema>;
