import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';

/** Used by Vitest tests that render components hitting apiClient. */
export const server = setupServer(...handlers);
