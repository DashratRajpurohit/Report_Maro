import { Router } from 'express';
import { listOrganizationsQuerySchema, type ListOrganizationsQuery } from '@sih/shared-types';
import { prisma } from '../lib/prisma.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { buildPaginationMeta, okList } from '../utils/http.js';
import { serializeOrganization } from '../services/serializers.js';

export const organizationsRouter = Router();

organizationsRouter.get('/organizations', optionalAuth, validate(listOrganizationsQuerySchema, 'query'), async (req, res, next) => {
  try {
    const q = req.query as unknown as ListOrganizationsQuery;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (q.type) where.type = q.type;
    if (q.district) where.district = q.district;
    if (q.q) where.name = { contains: q.q, mode: 'insensitive' };

    const [rows, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { _count: { select: { assignments: { where: { status: { in: ['PENDING', 'ACCEPTED'] } } } } } },
      }),
      prisma.organization.count({ where }),
    ]);

    okList(
      res,
      rows.map((r) => serializeOrganization({ ...r, activeAssignments: r._count.assignments })),
      buildPaginationMeta(q.page, q.pageSize, total),
    );
  } catch (err) {
    next(err);
  }
});
