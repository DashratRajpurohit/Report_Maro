import axios from 'axios';
import type { ApiErrorResponse } from '../schemas/index.js';
import { useAuthStore } from '../store/authStore.js';

/** Falls back to backend/'s default local port/path — see mocks/handlers.ts for the matching default. */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // backend/'s JWT has no refresh flow (PRs #4-#9) — a rejected/expired
      // token just signs the user out rather than looping forever.
      useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  },
);

/** Unwraps whichever of the two error shapes backend/ sent — see common.ts's ApiErrorResponse comment. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const data = (err as { response?: { data?: ApiErrorResponse } })?.response?.data;
  return data?.error?.message ?? data?.message ?? fallback;
}
