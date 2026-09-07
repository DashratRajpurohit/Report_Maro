import type { NotificationType } from '@sih/shared-types';
import { SOCKET_EVENTS, rooms } from '@sih/shared-types';
import { prisma } from '../lib/prisma.js';
import { getSocketServer } from '../lib/socket.js';

interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
}

/** Persists a notification and pushes it live to the user's room in one call. */
export async function notifyUser(input: NotifyInput): Promise<void> {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    },
  });

  getSocketServer()
    .to(rooms.user(input.userId))
    .emit(SOCKET_EVENTS.NOTIFICATION_NEW, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      link: notification.link,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    });
}

/** Same as notifyUser but for every member of a role or organization. */
export async function notifyRole(
  role: 'ADMIN' | 'UNIVERSITY' | 'INDUSTRY' | 'CITIZEN',
  input: Omit<NotifyInput, 'userId'>,
): Promise<void> {
  const users = await prisma.user.findMany({ where: { role }, select: { id: true } });
  await Promise.all(users.map((u) => notifyUser({ ...input, userId: u.id })));
}

export async function notifyOrganization(
  organizationId: string,
  input: Omit<NotifyInput, 'userId'>,
): Promise<void> {
  const users = await prisma.user.findMany({ where: { organizationId }, select: { id: true } });
  await Promise.all(users.map((u) => notifyUser({ ...input, userId: u.id })));
}
