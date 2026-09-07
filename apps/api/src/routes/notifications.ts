import { Router } from 'express';
import { listNotificationsQuerySchema, type ListNotificationsQuery } from '@sih/shared-types';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ApiError, buildPaginationMeta, ok, okList } from '../utils/http.js';
import { serializeNotification } from '../services/serializers.js';

export const notificationsRouter = Router();

notificationsRouter.get('/notifications', requireAuth, validate(listNotificationsQuerySchema, 'query'), async (req, res, next) => {
  try {
    const q = req.query as unknown as ListNotificationsQuery;
    const where = { userId: req.user!.sub, ...(q.unreadOnly ? { readAt: null } : {}) };

    const [rows, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.notification.count({ where }),
    ]);

    okList(res, rows.map(serializeNotification), buildPaginationMeta(q.page, q.pageSize, total));
  } catch (err) {
    next(err);
  }
});

notificationsRouter.get('/notifications/unread-count', requireAuth, async (req, res, next) => {
  try {
    const unread = await prisma.notification.count({ where: { userId: req.user!.sub, readAt: null } });
    ok(res, { unread });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.post('/notifications/:id/read', requireAuth, async (req, res, next) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification || notification.userId !== req.user!.sub) throw new ApiError('NOT_FOUND', 'Notification not found');

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { readAt: notification.readAt ?? new Date() },
    });
    ok(res, serializeNotification(updated));
  } catch (err) {
    next(err);
  }
});

notificationsRouter.post('/notifications/read-all', requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.sub, readAt: null },
      data: { readAt: new Date() },
    });
    ok(res, { unread: 0 });
  } catch (err) {
    next(err);
  }
});
