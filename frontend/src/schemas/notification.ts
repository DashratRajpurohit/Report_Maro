import { z } from 'zod';
import { idSchema } from './common.js';
import { notificationTypeSchema } from './enums.js';

export const notificationSchema = z.object({
  _id: idSchema,
  userId: idSchema.nullable(),
  message: z.string(),
  type: notificationTypeSchema,
  read: z.boolean(),
  link: z.string().nullable(),
  created_at: z.string(),
});
export type Notification = z.infer<typeof notificationSchema>;

export const listNotificationsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(notificationSchema),
  unreadCount: z.number(),
});
export type ListNotificationsResponse = z.infer<typeof listNotificationsResponseSchema>;
