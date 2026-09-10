import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../schemas/index.js';

interface AuthState {
  user: User | null;
  token: string | null;
  setSession: (user: User, token: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: (user, token) => set({ user, token }),
      clearSession: () => set({ user: null, token: null }),
    }),
    { name: 'sih-auth' },
  ),
);
