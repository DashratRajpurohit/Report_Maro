import { create } from 'zustand';
import type { Notification } from '@sih/shared-types';

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  setInitial: (items: Notification[], unreadCount: number) => void;
  pushLive: (item: Notification) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unreadCount: 0,
  setInitial: (items, unreadCount) => set({ items, unreadCount }),
  pushLive: (item) =>
    set((state) => ({ items: [item, ...state.items].slice(0, 50), unreadCount: state.unreadCount + 1 })),
  markAllRead: () =>
    set((state) => ({
      items: state.items.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
      unreadCount: 0,
    })),
}));
