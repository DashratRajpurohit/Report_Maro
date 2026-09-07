import { z } from 'zod';

/** Every id in the system is a cuid2-ish opaque string; never parse it. */
export const idSchema = z.string().min(1).max(64);
export const isoDateSchema = z.string().datetime({ offset: true });

/**
 * Machine-readable error codes. The web app switches on `code`, never on
 * `message` (messages are for humans and may change without a contract bump).
 */
export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'PAYLOAD_TOO_LARGE',
  'INTERNAL_ERROR',
  'SERVICE_UNAVAILABLE',
]);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const HTTP_STATUS_BY_ERROR_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/** One field-level complaint from Zod, flattened for the UI. */
export const fieldErrorSchema = z.object({
  path: z.string(),
  message: z.string(),
});
export type FieldError = z.infer<typeof fieldErrorSchema>;

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    details: z.array(fieldErrorSchema).optional(),
  }),
  requestId: z.string(),
});
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;

export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/** `GET` list endpoints all accept these; defaults are applied server-side. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * Success envelope. Single resources omit `meta`; list endpoints always send it.
 * Helpers below build the concrete schema for a given payload type.
 */
export const apiSuccess = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.literal(true), data });

export const apiListSuccess = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(item),
    meta: z.object({ pagination: paginationMetaSchema }),
  });

export type ApiSuccessResponse<T> = { success: true; data: T };
export type ApiListResponse<T> = {
  success: true;
  data: T[];
  meta: { pagination: PaginationMeta };
};
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Geo point constrained to the Jharkhand bounding box (plus slack). */
export const latitudeSchema = z.number().min(21.5).max(25.6);
export const longitudeSchema = z.number().min(83.2).max(88.0);

export const JHARKHAND_BBOX = {
  minLat: 21.9,
  maxLat: 25.4,
  minLng: 83.3,
  maxLng: 87.9,
  centerLat: 23.6102,
  centerLng: 85.2799,
} as const;

/** `?bbox=minLng,minLat,maxLng,maxLat` -- the map view's viewport filter. */
export const bboxQuerySchema = z
  .string()
  .regex(/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3}$/, 'bbox must be "minLng,minLat,maxLng,maxLat"')
  .transform((raw) => {
    const [minLng, minLat, maxLng, maxLat] = raw.split(',').map(Number) as [
      number,
      number,
      number,
      number,
    ];
    return { minLng, minLat, maxLng, maxLat };
  });
export type BBox = z.infer<typeof bboxQuerySchema>;

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  uptimeSeconds: z.number(),
  version: z.string(),
  dependencies: z.object({
    postgres: z.enum(['up', 'down']),
    redis: z.enum(['up', 'down']),
    mongo: z.enum(['up', 'down', 'disabled']),
  }),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
