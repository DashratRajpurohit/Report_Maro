import { useEffect } from 'react';
import { SOCKET_EVENTS } from '@sih/shared-types';
import { useAuthStore } from '../store/authStore.js';
import { useNotificationStore } from '../store/notificationStore.js';
import { connectSocket, disconnectSocket } from '../lib/socket.js';

/** Mounted once near the app root; keeps the socket alive for the whole session. */
export function useSocketConnection(): void {
  const tokens = useAuthStore((s) => s.tokens);
  const pushLive = useNotificationStore((s) => s.pushLive);

  useEffect(() => {
    if (!tokens) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(tokens.accessToken);
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, (payload) => pushLive(payload));

    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW);
    };
  }, [tokens, pushLive]);
}
