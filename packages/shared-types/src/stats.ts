import { z } from 'zod';
import { problemCategorySchema, prioritySchema, problemStatusSchema } from './enums.js';

/** Powers the admin dashboard tiles and charts in one round-trip. */
export const statsOverviewSchema = z.object({
  totals: z.object({
    problems: z.number().int().nonnegative(),
    problemsToday: z.number().int().nonnegative(),
    pendingTriage: z.number().int().nonnegative(),
    assigned: z.number().int().nonnegative(),
    resolved: z.number().int().nonnegative(),
    duplicates: z.number().int().nonnegative(),
    activeProjects: z.number().int().nonnegative(),
    fundedInr: z.number().int().nonnegative(),
  }),
  byCategory: z.array(
    z.object({ category: problemCategorySchema, count: z.number().int().nonnegative() }),
  ),
  byStatus: z.array(
    z.object({ status: problemStatusSchema, count: z.number().int().nonnegative() }),
  ),
  byPriority: z.array(
    z.object({ priority: prioritySchema, count: z.number().int().nonnegative() }),
  ),
  byDistrict: z.array(z.object({ district: z.string(), count: z.number().int().nonnegative() })),
  /** Last 14 days, oldest first; gaps are filled with zeroes server-side. */
  trend: z.array(z.object({ date: z.string(), count: z.number().int().nonnegative() })),
});
export type StatsOverview = z.infer<typeof statsOverviewSchema>;
