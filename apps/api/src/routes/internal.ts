import { Router } from 'express';
import {
  analysisCallbackRequestSchema,
  analysisFailureRequestSchema,
  similaritySearchRequestSchema,
  SOCKET_EVENTS,
  rooms,
  type AnalysisCallbackRequest,
  type AnalysisFailureRequest,
  type SimilaritySearchRequest,
  type SimilarityCandidate,
} from '@sih/shared-types';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AiDebugPayload } from '../lib/mongo.js';
import { getSocketServer } from '../lib/socket.js';
import { requireInternalKey } from '../middleware/internalAuth.js';
import { validate } from '../middleware/validate.js';
import { ApiError, ok } from '../utils/http.js';
import { notifyRole, notifyUser } from '../services/notificationService.js';

export const internalRouter = Router();

internalRouter.use(requireInternalKey);

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

internalRouter.post('/internal/problems/search-similar', validate(similaritySearchRequestSchema), async (req, res, next) => {
  try {
    const body = req.body as SimilaritySearchRequest;
    const vectorLiteral = toVectorLiteral(body.embedding);

    const rows = await prisma.$queryRaw<
      { id: string; title: string; status: string; createdAt: Date; score: number }[]
    >(Prisma.sql`
      SELECT id, title, status, "createdAt", 1 - (embedding <=> ${vectorLiteral}::vector) AS score
      FROM "Problem"
      WHERE embedding IS NOT NULL
        ${body.excludeProblemId ? Prisma.sql`AND id != ${body.excludeProblemId}` : Prisma.empty}
        ${body.district ? Prisma.sql`AND district = ${body.district}` : Prisma.empty}
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${body.limit}
    `);

    const candidates: SimilarityCandidate[] = rows
      .filter((r) => r.score >= body.minScore)
      .map((r) => ({ problemId: r.id, title: r.title, score: r.score, status: r.status, createdAt: r.createdAt.toISOString() }));

    ok(res, { candidates });
  } catch (err) {
    next(err);
  }
});

internalRouter.post('/internal/problems/:id/analysis', validate(analysisCallbackRequestSchema), async (req, res, next) => {
  try {
    const body = req.body as AnalysisCallbackRequest;
    const problem = await prisma.problem.findUnique({ where: { id: req.params.id } });
    if (!problem) throw new ApiError('NOT_FOUND', 'Problem not found');

    // Idempotency: a replay of an already-applied analysis is a no-op.
    if (problem.analyzedAt) {
      ok(res, { problemId: problem.id, status: problem.status, applied: false });
      return;
    }

    const isDuplicate = Boolean(body.duplicateOfId);
    const newStatus = isDuplicate ? 'DUPLICATE' : 'TRIAGED';

    await prisma.$transaction(async (tx) => {
      await tx.problem.update({
        where: { id: req.params.id },
        data: {
          status: newStatus,
          category: body.category,
          categoryConfidence: body.categoryConfidence,
          priority: body.priority,
          priorityScore: body.priorityScore,
          keywords: body.keywords,
          duplicateOfId: body.duplicateOfId,
          similarityScore: body.similarityScore,
          analysisModel: body.model,
          analyzedAt: new Date(),
        },
      });
      await tx.$executeRaw(Prisma.sql`
        UPDATE "Problem" SET embedding = ${toVectorLiteral(body.embedding)}::vector WHERE id = ${req.params.id}
      `);
    });

    await new AiDebugPayload({ problemId: req.params.id, payload: body }).save();

    getSocketServer()
      .to(rooms.user(problem.reporterId))
      .to(rooms.role('ADMIN'))
      .to(rooms.problem(problem.id))
      .emit(SOCKET_EVENTS.PROBLEM_ANALYZED, {
        at: new Date().toISOString(),
        problemId: problem.id,
        title: problem.title,
        status: newStatus,
        category: body.category,
        priority: body.priority,
        duplicateOfId: body.duplicateOfId,
      });

    if (!isDuplicate) {
      await notifyRole('ADMIN', {
        type: 'PROBLEM_ANALYZED',
        title: `New ${body.priority.toLowerCase()}-priority problem`,
        body: problem.title,
        link: `/problems/${problem.id}`,
      });
    }
    await notifyUser({
      userId: problem.reporterId,
      type: 'PROBLEM_ANALYZED',
      title: isDuplicate ? 'Your report matches an existing one' : 'Your report has been triaged',
      body: problem.title,
      link: `/problems/${problem.id}`,
    });

    ok(res, { problemId: problem.id, status: newStatus, applied: true });
  } catch (err) {
    next(err);
  }
});

internalRouter.post('/internal/problems/:id/failure', validate(analysisFailureRequestSchema), async (req, res, next) => {
  try {
    const body = req.body as AnalysisFailureRequest;
    const problem = await prisma.problem.findUnique({ where: { id: req.params.id } });
    if (!problem) throw new ApiError('NOT_FOUND', 'Problem not found');

    await prisma.problem.update({ where: { id: req.params.id }, data: { status: 'SUBMITTED' } });
    await new AiDebugPayload({ problemId: req.params.id, payload: { failure: body } }).save();

    await notifyRole('ADMIN', {
      type: 'PROBLEM_STATUS_CHANGED',
      title: 'AI analysis failed — needs manual triage',
      body: `${problem.title} (${body.attempts} attempts): ${body.reason}`,
      link: `/problems/${problem.id}`,
    });

    res.status(202).send();
  } catch (err) {
    next(err);
  }
});
