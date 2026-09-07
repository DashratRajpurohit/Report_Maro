import { z } from 'zod';
import { idSchema, isoDateSchema, paginationQuerySchema } from './common.js';
import { notificationTypeSchema } from './enums.js';

export const notificationSchema = z.object({
  id: idSchema,
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  /** Deep link the bell dropdown navigates to, e.g. "/problems/abc123". */
  link: z.string().nullable(),
  readAt: isoDateSchema.nullable(),
  createdAt: isoDateSchema,
});
export type Notification = z.infer<typeof notificationSchema>;

export const listNotificationsQuerySchema = paginationQuerySchema.extend({
  unreadOnly: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => v === true || v === 'true')
    .optional(),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

export const unreadCountSchema = z.object({ unread: z.number().int().nonnegative() });
export type UnreadCount = z.infer<typeof unreadCountSchema>;
