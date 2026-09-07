import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, PublicUser } from '@sih/shared-types';

interface AuthState {
  user: PublicUser | null;
  tokens: AuthTokens | null;
  setSession: (user: PublicUser, tokens: AuthTokens) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      setSession: (user, tokens) => set({ user, tokens }),
      clearSession: () => set({ user: null, tokens: null }),
    }),
    { name: 'sih-auth' },
  ),
);
