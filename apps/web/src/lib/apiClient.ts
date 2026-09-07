import axios from 'axios';
import type { ApiErrorResponse } from '@sih/shared-types';
import { useAuthStore } from '../store/authStore.js';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().tokens?.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { tokens } = useAuthStore.getState();
  if (!tokens) return null;

  try {
    const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
      refreshToken: tokens.refreshToken,
    });
    const { user, tokens: newTokens } = res.data.data;
    useAuthStore.getState().setSession(user, newTokens);
    return newTokens.accessToken;
  } catch {
    useAuthStore.getState().clearSession();
    return null;
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && useAuthStore.getState().tokens) {
      original._retry = true;
      refreshing ??= refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Pulls the human-readable message out of the contract's error envelope. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const data = (err as { response?: { data?: ApiErrorResponse } })?.response?.data;
  return data?.error?.message ?? fallback;
}
