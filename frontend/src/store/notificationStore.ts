import { create } from 'zustand';
import type { Notification } from '../schemas/index.js';

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  setInitial: (items: Notification[], unreadCount: number) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unreadCount: 0,
  setInitial: (items, unreadCount) => set({ items, unreadCount }),
  markAllRead: () =>
    set((state) => ({ items: state.items.map((n) => ({ ...n, read: true })), unreadCount: 0 })),
}));
