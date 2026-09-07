import { z } from 'zod';
import { idSchema, isoDateSchema, paginationQuerySchema } from './common.js';
import { organizationTypeSchema } from './enums.js';

export const organizationSchema = z.object({
  id: idSchema,
  name: z.string(),
  type: organizationTypeSchema,
  district: z.string().nullable(),
  contactEmail: z.string().email().nullable(),
  website: z.string().url().nullable(),
  /** Rough capacity signal the admin uses when picking a university. */
  activeAssignments: z.number().int().nonnegative(),
  createdAt: isoDateSchema,
});
export type Organization = z.infer<typeof organizationSchema>;

export const listOrganizationsQuerySchema = paginationQuerySchema.extend({
  type: organizationTypeSchema.optional(),
  district: z.string().max(80).optional(),
  q: z.string().max(120).trim().optional(),
});
export type ListOrganizationsQuery = z.infer<typeof listOrganizationsQuerySchema>;
