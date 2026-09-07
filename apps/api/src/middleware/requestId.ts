import type { NextFunction, Request, Response } from 'express';
import { nanoid } from 'nanoid';

export function requestId(req: Request, res: Response, next: NextFunction): void {
  res.locals.requestId = (req.headers['x-request-id'] as string) || nanoid();
  res.setHeader('x-request-id', res.locals.requestId);
  next();
}
