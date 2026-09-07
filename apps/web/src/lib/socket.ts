import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@sih/shared-types';

type PortalSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: PortalSocket | null = null;

/** Connects (or reuses) the single Socket.io connection, authenticated with the current access token. */
export function connectSocket(accessToken: string): PortalSocket {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token: accessToken },
    transports: ['websocket'],
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): PortalSocket | null {
  return socket;
}
