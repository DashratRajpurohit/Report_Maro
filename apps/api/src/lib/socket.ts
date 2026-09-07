import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@sih/shared-types';
import { rooms } from '@sih/shared-types';
import { env } from '../config/env.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { logger } from './logger.js';

type PortalServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

let io: PortalServer | null = null;

/**
 * Wires Socket.io onto the same HTTP server as Express. The handshake token
 * is verified once here; every room join after that is derived from the JWT,
 * never from anything the client claims — see docs/API_CONTRACT.md#socketio-events.
 */
export function initSocketServer(httpServer: HttpServer): PortalServer {
  io = new Server(httpServer, {
    cors: { origin: env.WEB_ORIGIN, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Missing auth token'));

    const payload = verifyAccessToken(token);
    if (!payload) return next(new Error('Invalid or expired token'));

    socket.data.userId = payload.sub;
    socket.data.role = payload.role;
    socket.data.organizationId = payload.organizationId;
    next();
  });

  io.on('connection', (socket) => {
    socket.join(rooms.user(socket.data.userId));
    socket.join(rooms.role(socket.data.role));
    if (socket.data.organizationId) {
      socket.join(rooms.organization(socket.data.organizationId));
    }

    socket.on('subscribe:problem', (problemId: string) => {
      socket.join(rooms.problem(problemId));
    });
    socket.on('unsubscribe:problem', (problemId: string) => {
      socket.leave(rooms.problem(problemId));
    });

    logger.debug({ userId: socket.data.userId }, 'socket connected');
  });

  return io;
}

/** Throws if called before initSocketServer — a real bug, not a runtime edge case. */
export function getSocketServer(): PortalServer {
  if (!io) throw new Error('Socket.io server not initialized');
  return io;
}
