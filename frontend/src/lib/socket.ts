import { io, type Socket } from 'socket.io-client';
import type { ServerToClientEvents } from '../schemas/index.js';

type PortalSocket = Socket<ServerToClientEvents>;

let socket: PortalSocket | null = null;

/** Connects (or reuses) the single Socket.io connection, authenticated with the current JWT. */
export function connectSocket(token: string): PortalSocket {
  if (socket?.connected) return socket;
  socket = io(import.meta.env.VITE_SOCKET_URL, { auth: { token }, transports: ['websocket'] });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): PortalSocket | null {
  return socket;
}
