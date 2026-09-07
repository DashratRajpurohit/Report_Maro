import { Router } from 'express';
import type { StatsOverview } from '@sih/shared-types';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok } from '../utils/http.js';

export const statsRouter = Router();

statsRouter.get('/stats/overview', requireAuth, requireRole('ADMIN'), async (_req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalProblems,
      problemsToday,
      pendingTriage,
      assigned,
      resolved,
      duplicates,
      activeProjects,
      fundedAgg,
      byCategoryRaw,
      byStatusRaw,
      byPriorityRaw,
      byDistrictRaw,
      recentProblems,
    ] = await Promise.all([
      prisma.problem.count(),
      prisma.problem.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.problem.count({ where: { status: 'TRIAGED' } }),
      prisma.problem.count({ where: { status: 'ASSIGNED' } }),
      prisma.problem.count({ where: { status: 'RESOLVED' } }),
      prisma.problem.count({ where: { status: 'DUPLICATE' } }),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.funding.aggregate({ _sum: { amountInr: true } }),
      prisma.problem.groupBy({ by: ['category'], _count: true, where: { category: { not: null } } }),
      prisma.problem.groupBy({ by: ['status'], _count: true }),
      prisma.problem.groupBy({ by: ['priority'], _count: true, where: { priority: { not: null } } }),
      prisma.problem.groupBy({ by: ['district'], _count: true }),
      prisma.problem.findMany({ where: { createdAt: { gte: fourteenDaysAgo } }, select: { createdAt: true } }),
    ]);

    const trendMap = new Map<string, number>();
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(fourteenDaysAgo);
      d.setDate(d.getDate() + i);
      trendMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const p of recentProblems) {
      const key = p.createdAt.toISOString().slice(0, 10);
      trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }

    const overview: StatsOverview = {
      totals: {
        problems: totalProblems,
        problemsToday,
        pendingTriage,
        assigned,
        resolved,
        duplicates,
        activeProjects,
        fundedInr: fundedAgg._sum.amountInr ?? 0,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byCategory: byCategoryRaw.map((r) => ({ category: r.category as any, count: r._count })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byStatus: byStatusRaw.map((r) => ({ status: r.status as any, count: r._count })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byPriority: byPriorityRaw.map((r) => ({ priority: r.priority as any, count: r._count })),
      byDistrict: byDistrictRaw.map((r) => ({ district: r.district, count: r._count })),
      trend: Array.from(trendMap.entries()).map(([date, count]) => ({ date, count })),
    };

    ok(res, overview);
  } catch (err) {
    next(err);
  }
});
