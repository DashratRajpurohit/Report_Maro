import { Router } from 'express';
import {
  createProblemRequestSchema,
  listProblemsQuerySchema,
  updateProblemStatusRequestSchema,
  SOCKET_EVENTS,
  rooms,
  type CreateProblemRequest,
  type ListProblemsQuery,
  type UpdateProblemStatusRequest,
} from '@sih/shared-types';
import { prisma } from '../lib/prisma.js';
import { enqueueProblemAnalysis } from '../lib/queue.js';
import { getSocketServer } from '../lib/socket.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ApiError, buildPaginationMeta, ok, okList } from '../utils/http.js';
import { serializeProblem, serializeProblemSummary } from '../services/serializers.js';

export const problemsRouter = Router();

problemsRouter.get('/problems', optionalAuth, validate(listProblemsQuerySchema, 'query'), async (req, res, next) => {
  try {
    const q = req.query as unknown as ListProblemsQuery;

    if (q.mine && !req.user) throw new ApiError('UNAUTHORIZED', 'Sign in to view your own reports');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (q.status) where.status = q.status;
    if (q.category) where.category = q.category;
    if (q.priority) where.priority = q.priority;
    if (q.district) where.district = q.district;
    if (q.mine) where.reporterId = req.user!.sub;
    if (q.q) {
      where.OR = [
        { title: { contains: q.q, mode: 'insensitive' } },
        { description: { contains: q.q, mode: 'insensitive' } },
      ];
    }
    if (q.bbox) {
      where.longitude = { gte: q.bbox.minLng, lte: q.bbox.maxLng };
      where.latitude = { gte: q.bbox.minLat, lte: q.bbox.maxLat };
    }

    const orderBy =
      q.sort === 'oldest'
        ? { createdAt: 'asc' as const }
        : q.sort === 'priority'
          ? { priorityScore: 'desc' as const }
          : { createdAt: 'desc' as const };

    const [rows, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        include: { reporter: true },
        orderBy,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.problem.count({ where }),
    ]);

    okList(res, rows.map(serializeProblemSummary), buildPaginationMeta(q.page, q.pageSize, total));
  } catch (err) {
    next(err);
  }
});

problemsRouter.post('/problems', requireAuth, requireRole('CITIZEN'), validate(createProblemRequestSchema), async (req, res, next) => {
  try {
    const body = req.body as CreateProblemRequest;

    const problem = await prisma.problem.create({
      data: {
        title: body.title,
        description: body.description,
        latitude: body.location.latitude,
        longitude: body.location.longitude,
        district: body.location.district,
        address: body.location.address,
        photos: body.photos,
        reporterId: req.user!.sub,
        status: 'SUBMITTED',
      },
      include: { reporter: true },
    });

    await enqueueProblemAnalysis({
      problemId: problem.id,
      title: problem.title,
      description: problem.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      district: problem.district as any,
      latitude: problem.latitude,
      longitude: problem.longitude,
      suggestedCategory: body.suggestedCategory,
      submittedAt: problem.createdAt.toISOString(),
    });

    getSocketServer().to(rooms.role('ADMIN')).emit(SOCKET_EVENTS.PROBLEM_CREATED, {
      at: new Date().toISOString(),
      problemId: problem.id,
      title: problem.title,
      district: problem.district,
      status: problem.status,
      latitude: problem.latitude,
      longitude: problem.longitude,
    });

    ok(res, serializeProblem(problem), 201);
  } catch (err) {
    next(err);
  }
});

problemsRouter.get('/problems/:id', optionalAuth, async (req, res, next) => {
  try {
    const problem = await prisma.problem.findUnique({
      where: { id: req.params.id },
      include: { reporter: true, assignment: true },
    });
    if (!problem) throw new ApiError('NOT_FOUND', 'Problem not found');
    ok(res, serializeProblem({ ...problem, assignmentId: problem.assignment?.id ?? null }));
  } catch (err) {
    next(err);
  }
});

problemsRouter.patch(
  '/problems/:id/status',
  requireAuth,
  requireRole('ADMIN'),
  validate(updateProblemStatusRequestSchema),
  async (req, res, next) => {
    try {
      const body = req.body as UpdateProblemStatusRequest;
      const existing = await prisma.problem.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new ApiError('NOT_FOUND', 'Problem not found');

      const problem = await prisma.problem.update({
        where: { id: req.params.id },
        data: { status: body.status },
        include: { reporter: true, assignment: true },
      });

      getSocketServer().to(rooms.user(problem.reporterId)).to(rooms.problem(problem.id)).emit(
        SOCKET_EVENTS.PROBLEM_STATUS_CHANGED,
        {
          at: new Date().toISOString(),
          problemId: problem.id,
          status: problem.status,
          previousStatus: existing.status,
        },
      );

      ok(res, serializeProblem({ ...problem, assignmentId: problem.assignment?.id ?? null }));
    } catch (err) {
      next(err);
    }
  },
);
