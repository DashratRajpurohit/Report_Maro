import { z } from 'zod';

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const;

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * The browser asks for a presigned PUT, uploads the bytes straight to object
 * storage, then sends only `{ key, url }` back with the problem. The API never
 * proxies image bytes.
 */
export const presignUploadRequestSchema = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});
export type PresignUploadRequest = z.infer<typeof presignUploadRequestSchema>;

export const presignUploadResponseSchema = z.object({
  key: z.string(),
  /** PUT the raw file here with the same Content-Type. */
  uploadUrl: z.string().url(),
  /** Public URL to store on the problem once the PUT succeeds. */
  publicUrl: z.string().url(),
  expiresIn: z.number().int().positive(),
});
export type PresignUploadResponse = z.infer<typeof presignUploadResponseSchema>;
