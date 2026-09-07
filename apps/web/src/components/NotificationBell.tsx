import { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient.js';
import { useNotificationStore } from '../store/notificationStore.js';

export function NotificationBell() {
  const { items, unreadCount, setInitial, markAllRead } = useNotificationStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    apiClient
      .get('/notifications', { params: { pageSize: 10 } })
      .then((res) => setInitial(res.data.data, res.data.data.filter((n: { readAt: string | null }) => !n.readAt).length))
      .catch(() => undefined);
  }, [setInitial]);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (unreadCount > 0) {
      await apiClient.post('/notifications/read-all').catch(() => undefined);
      markAllRead();
    }
  };

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative rounded-full p-2 hover:bg-slate-100" aria-label="Notifications">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="max-h-96 overflow-y-auto p-2">
            {items.length === 0 && <p className="p-3 text-sm text-slate-500">No notifications yet.</p>}
            {items.map((n) => (
              <div key={n.id} className="rounded-lg p-3 hover:bg-slate-50">
                <p className="text-sm font-medium text-slate-900">{n.title}</p>
                <p className="text-xs text-slate-500">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
