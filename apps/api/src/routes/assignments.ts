import { Router } from 'express';
import {
  createAssignmentRequestSchema,
  listAssignmentsQuerySchema,
  respondToAssignmentRequestSchema,
  SOCKET_EVENTS,
  rooms,
  type CreateAssignmentRequest,
  type ListAssignmentsQuery,
  type RespondToAssignmentRequest,
} from '@sih/shared-types';
import { prisma } from '../lib/prisma.js';
import { getSocketServer } from '../lib/socket.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ApiError, buildPaginationMeta, ok, okList } from '../utils/http.js';
import { serializeAssignment } from '../services/serializers.js';
import { notifyOrganization, notifyRole, notifyUser } from '../services/notificationService.js';

export const assignmentsRouter = Router();

const assignmentInclude = {
  problem: { include: { reporter: true } },
  university: true,
  assignedBy: true,
  proposal: true,
} as const;

assignmentsRouter.get('/assignments', requireAuth, validate(listAssignmentsQuerySchema, 'query'), async (req, res, next) => {
  try {
    const q = req.query as unknown as ListAssignmentsQuery;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (q.status) where.status = q.status;
    if (q.problemId) where.problemId = q.problemId;
    if (q.universityId) where.universityId = q.universityId;
    if (q.mine && req.user!.role === 'UNIVERSITY') where.universityId = req.user!.organizationId;

    const [rows, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        include: assignmentInclude,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.assignment.count({ where }),
    ]);

    okList(res, rows.map(serializeAssignment), buildPaginationMeta(q.page, q.pageSize, total));
  } catch (err) {
    next(err);
  }
});

assignmentsRouter.post('/assignments', requireAuth, requireRole('ADMIN'), validate(createAssignmentRequestSchema), async (req, res, next) => {
  try {
    const body = req.body as CreateAssignmentRequest;

    const problem = await prisma.problem.findUnique({ where: { id: body.problemId }, include: { assignment: true } });
    if (!problem) throw new ApiError('NOT_FOUND', 'Problem not found');
    if (problem.assignment && ['PENDING', 'ACCEPTED'].includes(problem.assignment.status)) {
      throw new ApiError('CONFLICT', 'Problem already has an active assignment');
    }

    const university = await prisma.organization.findUnique({ where: { id: body.universityId } });
    if (!university || university.type !== 'UNIVERSITY') {
      throw new ApiError('VALIDATION_ERROR', 'universityId must reference a UNIVERSITY organization');
    }

    const assignment = await prisma.$transaction(async (tx) => {
      const created = await tx.assignment.create({
        data: {
          problemId: body.problemId,
          universityId: body.universityId,
          note: body.note,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          assignedById: req.user!.sub,
        },
        include: assignmentInclude,
      });
      await tx.problem.update({ where: { id: body.problemId }, data: { status: 'ASSIGNED' } });
      return created;
    });

    getSocketServer().to(rooms.organization(body.universityId)).emit(SOCKET_EVENTS.ASSIGNMENT_CREATED, {
      at: new Date().toISOString(),
      assignmentId: assignment.id,
      problemId: assignment.problemId,
      problemTitle: assignment.problem.title,
      universityId: assignment.universityId,
      universityName: assignment.university.name,
    });

    await notifyOrganization(body.universityId, {
      type: 'PROBLEM_ASSIGNED',
      title: 'New problem assigned to you',
      body: assignment.problem.title,
      link: `/problems/${assignment.problemId}`,
    });

    ok(res, serializeAssignment(assignment), 201);
  } catch (err) {
    next(err);
  }
});

assignmentsRouter.get('/assignments/:id', requireAuth, async (req, res, next) => {
  try {
    const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id }, include: assignmentInclude });
    if (!assignment) throw new ApiError('NOT_FOUND', 'Assignment not found');
    ok(res, serializeAssignment(assignment));
  } catch (err) {
    next(err);
  }
});

assignmentsRouter.patch(
  '/assignments/:id',
  requireAuth,
  requireRole('UNIVERSITY'),
  validate(respondToAssignmentRequestSchema),
  async (req, res, next) => {
    try {
      const body = req.body as RespondToAssignmentRequest;
      const existing = await prisma.assignment.findUnique({ where: { id: req.params.id }, include: assignmentInclude });
      if (!existing) throw new ApiError('NOT_FOUND', 'Assignment not found');
      if (existing.universityId !== req.user!.organizationId) {
        throw new ApiError('FORBIDDEN', 'Not your organization\'s assignment');
      }

      const assignment = await prisma.$transaction(async (tx) => {
        const updated = await tx.assignment.update({
          where: { id: req.params.id },
          data: { status: body.status, respondedAt: new Date() },
          include: assignmentInclude,
        });
        if (body.status === 'DECLINED') {
          await tx.problem.update({ where: { id: updated.problemId }, data: { status: 'TRIAGED' } });
        }
        if (body.status === 'COMPLETED') {
          await tx.problem.update({ where: { id: updated.problemId }, data: { status: 'RESOLVED' } });
        }
        return updated;
      });

      getSocketServer().to(rooms.role('ADMIN')).to(rooms.user(assignment.problem.reporterId)).emit(
        SOCKET_EVENTS.ASSIGNMENT_UPDATED,
        { at: new Date().toISOString(), assignmentId: assignment.id, problemId: assignment.problemId, status: assignment.status },
      );

      if (body.status === 'DECLINED') {
        await notifyRole('ADMIN', {
          type: 'PROBLEM_STATUS_CHANGED',
          title: 'Assignment declined — needs reassignment',
          body: `${assignment.university.name} declined: ${assignment.problem.title}`,
          link: `/problems/${assignment.problemId}`,
        });
      } else {
        await notifyUser({
          userId: assignment.problem.reporterId,
          type: 'PROBLEM_STATUS_CHANGED',
          title: `Assignment ${body.status.toLowerCase()}`,
          body: assignment.problem.title,
          link: `/problems/${assignment.problemId}`,
        });
      }

      ok(res, serializeAssignment(assignment));
    } catch (err) {
      next(err);
    }
  },
);
