import type { NextFunction, Request, Response } from 'express';
import { INTERNAL_API_KEY_HEADER } from '@sih/shared-types';
import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';

/**
 * Guards /api/v1/internal/*. This header-based secret is intentionally not a
 * JWT — the AI worker is a service, not a user. Never mount this router
 * behind the public CORS policy. See docs/API_CONTRACT.md#the-internal-api.
 */
export function requireInternalKey(req: Request, _res: Response, next: NextFunction): void {
  const key = req.headers[INTERNAL_API_KEY_HEADER];
  if (key !== env.INTERNAL_API_SECRET) {
    next(new ApiError('UNAUTHORIZED', 'Invalid internal API key'));
    return;
  }
  next();
}
