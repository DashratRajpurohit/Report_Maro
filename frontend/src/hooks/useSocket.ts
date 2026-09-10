import { useEffect } from 'react';
import { SOCKET_EVENTS } from '../schemas/index.js';
import { useAuthStore } from '../store/authStore.js';
import { connectSocket, disconnectSocket } from '../lib/socket.js';
import { apiClient } from '../lib/apiClient.js';
import { useNotificationStore } from '../store/notificationStore.js';

/**
 * Mounted once near the app root. backend/'s controllers already emit these
 * five events (see packages/shared-types/src/socket.ts); rather than trust
 * each payload's shape long-term, we just refetch the notification feed on
 * any of them, since the controllers also persist a Notification document
 * for the same action.
 */
export function useSocketConnection(): void {
  const token = useAuthStore((s) => s.token);
  const setInitial = useNotificationStore((s) => s.setInitial);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(token);
    const refetch = () => {
      apiClient
        .get('/notifications')
        .then((res) => setInitial(res.data.data, res.data.unreadCount))
        .catch(() => undefined);
    };

    Object.values(SOCKET_EVENTS).forEach((event) => socket.on(event, refetch));
    return () => {
      Object.values(SOCKET_EVENTS).forEach((event) => socket.off(event, refetch));
    };
  }, [token, setInitial]);
}
