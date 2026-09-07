import { Router } from 'express';
import {
  createFundingRequestSchema,
  listProjectsQuerySchema,
  updateProjectStatusRequestSchema,
  SOCKET_EVENTS,
  rooms,
  type CreateFundingRequest,
  type ListProjectsQuery,
  type UpdateProjectStatusRequest,
} from '@sih/shared-types';
import { prisma } from '../lib/prisma.js';
import { getSocketServer } from '../lib/socket.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ApiError, buildPaginationMeta, ok, okList } from '../utils/http.js';
import { serializeFunding, serializeProject, serializeProjectSummary } from '../services/serializers.js';
import { notifyUser, notifyOrganization } from '../services/notificationService.js';

export const projectsRouter = Router();

const projectInclude = {
  proposal: { include: { assignment: { include: { problem: { include: { reporter: true } }, university: true } } } },
  fundings: { include: { industry: true, fundedBy: true } },
} as const;

projectsRouter.get('/projects', optionalAuth, validate(listProjectsQuerySchema, 'query'), async (req, res, next) => {
  try {
    const q = req.query as unknown as ListProjectsQuery;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (q.status) where.status = q.status;
    if (q.universityId) where.proposal = { assignment: { universityId: q.universityId } };
    if (q.category) where.proposal = { ...where.proposal, assignment: { ...where.proposal?.assignment, problem: { category: q.category } } };
    if (q.fundedByMe && req.user?.role === 'INDUSTRY') {
      where.fundings = { some: { industryId: req.user.organizationId } };
    }

    const [rows, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: projectInclude,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.project.count({ where }),
    ]);

    okList(res, rows.map(serializeProjectSummary), buildPaginationMeta(q.page, q.pageSize, total));
  } catch (err) {
    next(err);
  }
});

projectsRouter.get('/projects/:id', optionalAuth, async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id }, include: projectInclude });
    if (!project) throw new ApiError('NOT_FOUND', 'Project not found');
    ok(res, serializeProject(project));
  } catch (err) {
    next(err);
  }
});

projectsRouter.patch(
  '/projects/:id/status',
  requireAuth,
  requireRole('UNIVERSITY', 'ADMIN'),
  validate(updateProjectStatusRequestSchema),
  async (req, res, next) => {
    try {
      const body = req.body as UpdateProjectStatusRequest;
      const existing = await prisma.project.findUnique({ where: { id: req.params.id }, include: projectInclude });
      if (!existing) throw new ApiError('NOT_FOUND', 'Project not found');
      if (
        req.user!.role === 'UNIVERSITY' &&
        existing.proposal.assignment.universityId !== req.user!.organizationId
      ) {
        throw new ApiError('FORBIDDEN', 'Not your project');
      }

      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: {
          status: body.status,
          completedAt: body.status === 'COMPLETED' ? new Date() : undefined,
        },
        include: projectInclude,
      });

      getSocketServer()
        .to(rooms.user(project.proposal.assignment.problem.reporterId))
        .to(rooms.role('ADMIN'))
        .emit(SOCKET_EVENTS.PROJECT_STATUS_CHANGED, {
          at: new Date().toISOString(),
          projectId: project.id,
          status: project.status,
        });

      ok(res, serializeProject(project));
    } catch (err) {
      next(err);
    }
  },
);

projectsRouter.get('/projects/:id/fundings', optionalAuth, async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id }, include: projectInclude });
    if (!project) throw new ApiError('NOT_FOUND', 'Project not found');
    const fundings = project.fundings.map((f) => serializeFunding(f, project.id));
    okList(res, fundings, { page: 1, pageSize: fundings.length || 1, total: fundings.length, totalPages: 1 });
  } catch (err) {
    next(err);
  }
});

projectsRouter.post(
  '/projects/:id/fundings',
  requireAuth,
  requireRole('INDUSTRY'),
  validate(createFundingRequestSchema),
  async (req, res, next) => {
    try {
      const body = req.body as CreateFundingRequest;
      const existing = await prisma.project.findUnique({ where: { id: req.params.id }, include: projectInclude });
      if (!existing) throw new ApiError('NOT_FOUND', 'Project not found');
      if (existing.status !== 'AWAITING_FUNDING' && existing.status !== 'ACTIVE') {
        throw new ApiError('CONFLICT', 'Project is not open for funding');
      }

      const alreadyFunded = existing.fundings.reduce((sum, f) => sum + f.amountInr, 0);
      const remaining = existing.budgetInr - alreadyFunded;
      if (body.amountInr > remaining) {
        throw new ApiError('CONFLICT', `Pledge exceeds remaining budget (₹${remaining} left)`);
      }

      const project = await prisma.$transaction(async (tx) => {
        await tx.funding.create({
          data: {
            projectId: req.params.id!,
            industryId: req.user!.organizationId!,
            amountInr: body.amountInr,
            note: body.note,
            fundedById: req.user!.sub,
          },
        });

        const nowFunded = alreadyFunded + body.amountInr;
        const fullyFunded = nowFunded >= existing.budgetInr;

        if (fullyFunded && existing.status === 'AWAITING_FUNDING') {
          await tx.project.update({ where: { id: req.params.id }, data: { status: 'ACTIVE', startedAt: new Date() } });
          await tx.problem.update({
            where: { id: existing.proposal.assignment.problemId },
            data: { status: 'IN_PROGRESS' },
          });
        }

        return tx.project.findUniqueOrThrow({ where: { id: req.params.id }, include: projectInclude });
      });

      const industry = await prisma.organization.findUniqueOrThrow({ where: { id: req.user!.organizationId! } });
      const fundedInr = project.fundings.reduce((sum, f) => sum + f.amountInr, 0);
      const fundedPercent = project.budgetInr > 0 ? Math.min(100, (fundedInr / project.budgetInr) * 100) : 0;

      getSocketServer()
        .to(rooms.organization(project.proposal.assignment.universityId))
        .to(rooms.user(project.proposal.assignment.problem.reporterId))
        .to(rooms.role('ADMIN'))
        .emit(SOCKET_EVENTS.PROJECT_FUNDED, {
          at: new Date().toISOString(),
          projectId: project.id,
          title: project.proposal.title,
          amountInr: body.amountInr,
          fundedInr,
          budgetInr: project.budgetInr,
          fundedPercent,
          industryName: industry.name,
          status: project.status,
        });

      await notifyOrganization(project.proposal.assignment.universityId, {
        type: 'PROJECT_FUNDED',
        title: 'Your project received funding',
        body: `${industry.name} pledged ₹${body.amountInr.toLocaleString('en-IN')}`,
        link: `/projects/${project.id}`,
      });
      await notifyUser({
        userId: project.proposal.assignment.problem.reporterId,
        type: 'PROJECT_FUNDED',
        title: 'Your reported problem is being funded',
        body: project.proposal.title,
        link: `/projects/${project.id}`,
      });

      ok(res, serializeProject(project), 201);
    } catch (err) {
      next(err);
    }
  },
);
