import type { NextFunction, Request, Response } from 'express';
import { ApiError, sendApiError } from '../utils/http.js';
import { logger } from '../lib/logger.js';

export function notFoundHandler(req: Request, res: Response): void {
  sendApiError(res, new ApiError('NOT_FOUND', `No route for ${req.method} ${req.path}`));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    sendApiError(res, err);
    return;
  }

  logger.error({ err, requestId: res.locals.requestId }, 'unhandled error');
  sendApiError(res, new ApiError('INTERNAL_ERROR', 'Something went wrong'));
}
