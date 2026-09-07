import type { NextFunction, Request, Response } from 'express';
import type { JwtPayload, UserRole } from '@sih/shared-types';
import { ApiError } from '../utils/http.js';
import { verifyAccessToken } from '../utils/jwt.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Populates req.user when a valid bearer token is present; never rejects on its own. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length);
    const payload = verifyAccessToken(token);
    if (payload) req.user = payload;
  }
  next();
}

/** Rejects with 401 unless optionalAuth (mounted earlier) found a valid user. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new ApiError('UNAUTHORIZED', 'Sign in required'));
    return;
  }
  next();
}

/** Mount after requireAuth. 403s if the signed-in user's role isn't in `roles`. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ApiError('FORBIDDEN', `Requires one of: ${roles.join(', ')}`));
      return;
    }
    next();
  };
}
