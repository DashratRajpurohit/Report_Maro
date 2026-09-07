import { Router } from 'express';
import {
  createProposalRequestSchema,
  listProposalsQuerySchema,
  reviewProposalRequestSchema,
  updateProposalRequestSchema,
  SOCKET_EVENTS,
  rooms,
  type CreateProposalRequest,
  type ListProposalsQuery,
  type ReviewProposalRequest,
  type UpdateProposalRequest,
} from '@sih/shared-types';
import { prisma } from '../lib/prisma.js';
import { getSocketServer } from '../lib/socket.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ApiError, buildPaginationMeta, ok, okList } from '../utils/http.js';
import { serializeProposal } from '../services/serializers.js';
import { notifyOrganization, notifyRole } from '../services/notificationService.js';

export const proposalsRouter = Router();

const proposalInclude = {
  assignment: { include: { problem: { include: { reporter: true } }, university: true } },
  submittedBy: true,
  project: true,
} as const;

proposalsRouter.get('/proposals', requireAuth, validate(listProposalsQuerySchema, 'query'), async (req, res, next) => {
  try {
    const q = req.query as unknown as ListProposalsQuery;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (q.status) where.status = q.status;
    if (q.assignmentId) where.assignmentId = q.assignmentId;
    if (q.universityId) where.assignment = { universityId: q.universityId };
    if (q.mine && req.user!.role === 'UNIVERSITY') where.assignment = { universityId: req.user!.organizationId };

    const [rows, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        include: proposalInclude,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.proposal.count({ where }),
    ]);

    okList(res, rows.map(serializeProposal), buildPaginationMeta(q.page, q.pageSize, total));
  } catch (err) {
    next(err);
  }
});

proposalsRouter.post('/proposals', requireAuth, requireRole('UNIVERSITY'), validate(createProposalRequestSchema), async (req, res, next) => {
  try {
    const body = req.body as CreateProposalRequest;

    const assignment = await prisma.assignment.findUnique({
      where: { id: body.assignmentId },
      include: { problem: true, university: true, proposal: true },
    });
    if (!assignment) throw new ApiError('NOT_FOUND', 'Assignment not found');
    if (assignment.universityId !== req.user!.organizationId) throw new ApiError('FORBIDDEN', 'Not your assignment');
    if (assignment.status !== 'ACCEPTED') throw new ApiError('CONFLICT', 'Assignment must be ACCEPTED first');
    if (assignment.proposal) throw new ApiError('CONFLICT', 'A proposal already exists for this assignment');

    const proposal = await prisma.proposal.create({
      data: {
        assignmentId: body.assignmentId,
        title: body.title,
        summary: body.summary,
        approach: body.approach,
        teamMembers: body.teamMembers,
        budgetInr: body.budgetInr,
        timelineWeeks: body.timelineWeeks,
        status: body.status,
        submittedById: req.user!.sub,
      },
      include: proposalInclude,
    });

    if (proposal.status === 'SUBMITTED') {
      getSocketServer().to(rooms.role('ADMIN')).emit(SOCKET_EVENTS.PROPOSAL_SUBMITTED, {
        at: new Date().toISOString(),
        proposalId: proposal.id,
        assignmentId: proposal.assignmentId,
        problemId: assignment.problemId,
        title: proposal.title,
        universityName: assignment.university.name,
        budgetInr: proposal.budgetInr,
      });
      await notifyRole('ADMIN', {
        type: 'PROPOSAL_SUBMITTED',
        title: 'New proposal to review',
        body: proposal.title,
        link: `/proposals/${proposal.id}`,
      });
    }

    ok(res, serializeProposal(proposal), 201);
  } catch (err) {
    next(err);
  }
});

proposalsRouter.get('/proposals/:id', requireAuth, async (req, res, next) => {
  try {
    const proposal = await prisma.proposal.findUnique({ where: { id: req.params.id }, include: proposalInclude });
    if (!proposal) throw new ApiError('NOT_FOUND', 'Proposal not found');
    ok(res, serializeProposal(proposal));
  } catch (err) {
    next(err);
  }
});

proposalsRouter.patch('/proposals/:id', requireAuth, requireRole('UNIVERSITY'), validate(updateProposalRequestSchema), async (req, res, next) => {
  try {
    const body = req.body as UpdateProposalRequest;
    const existing = await prisma.proposal.findUnique({ where: { id: req.params.id }, include: proposalInclude });
    if (!existing) throw new ApiError('NOT_FOUND', 'Proposal not found');
    if (existing.submittedById !== req.user!.sub) throw new ApiError('FORBIDDEN', 'Not your proposal');
    if (existing.status !== 'DRAFT') throw new ApiError('CONFLICT', 'Only a DRAFT proposal can be edited');

    const proposal = await prisma.proposal.update({
      where: { id: req.params.id },
      data: body,
      include: proposalInclude,
    });

    if (proposal.status === 'SUBMITTED' && existing.status === 'DRAFT') {
      getSocketServer().to(rooms.role('ADMIN')).emit(SOCKET_EVENTS.PROPOSAL_SUBMITTED, {
        at: new Date().toISOString(),
        proposalId: proposal.id,
        assignmentId: proposal.assignmentId,
        problemId: proposal.assignment.problemId,
        title: proposal.title,
        universityName: proposal.assignment.university.name,
        budgetInr: proposal.budgetInr,
      });
    }

    ok(res, serializeProposal(proposal));
  } catch (err) {
    next(err);
  }
});

proposalsRouter.patch(
  '/proposals/:id/review',
  requireAuth,
  requireRole('ADMIN'),
  validate(reviewProposalRequestSchema),
  async (req, res, next) => {
    try {
      const body = req.body as ReviewProposalRequest;
      const existing = await prisma.proposal.findUnique({ where: { id: req.params.id }, include: proposalInclude });
      if (!existing) throw new ApiError('NOT_FOUND', 'Proposal not found');
      if (existing.status !== 'SUBMITTED') throw new ApiError('CONFLICT', 'Only a SUBMITTED proposal can be reviewed');

      const proposal = await prisma.$transaction(async (tx) => {
        const updated = await tx.proposal.update({
          where: { id: req.params.id },
          data: { status: body.status, reviewNote: body.reviewNote, reviewedAt: new Date() },
          include: proposalInclude,
        });

        if (body.status === 'APPROVED') {
          await tx.project.create({
            data: { proposalId: updated.id, budgetInr: updated.budgetInr, timelineWeeks: updated.timelineWeeks },
          });
        }

        return tx.proposal.findUniqueOrThrow({ where: { id: req.params.id }, include: proposalInclude });
      });

      getSocketServer().to(rooms.organization(proposal.assignment.universityId)).emit(SOCKET_EVENTS.PROPOSAL_REVIEWED, {
        at: new Date().toISOString(),
        proposalId: proposal.id,
        status: proposal.status,
        projectId: proposal.project?.id ?? null,
      });

      await notifyOrganization(proposal.assignment.universityId, {
        type: 'PROPOSAL_REVIEWED',
        title: `Proposal ${body.status.toLowerCase()}`,
        body: proposal.title,
        link: `/proposals/${proposal.id}`,
      });

      if (body.status === 'APPROVED' && proposal.project) {
        getSocketServer().to(rooms.role('INDUSTRY')).emit(SOCKET_EVENTS.PROJECT_CREATED, {
          at: new Date().toISOString(),
          projectId: proposal.project.id,
          title: proposal.title,
          budgetInr: proposal.budgetInr,
          category: proposal.assignment.problem.category,
        });
        await notifyRole('INDUSTRY', {
          type: 'PROPOSAL_REVIEWED',
          title: 'New fundable project',
          body: proposal.title,
          link: `/projects/${proposal.project.id}`,
        });
      }

      ok(res, serializeProposal(proposal));
    } catch (err) {
      next(err);
    }
  },
);
