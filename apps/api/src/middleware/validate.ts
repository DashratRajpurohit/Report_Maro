import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/http.js';

type Source = 'body' | 'query' | 'params';

/**
 * Parses `req[source]` against `schema`, replaces it with the parsed
 * (defaulted/coerced) value, or throws a VALIDATION_ERROR ApiError. Every
 * route handler in this app receives already-validated input — see AGENTS.md.
 */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      next(new ApiError('VALIDATION_ERROR', 'Request failed validation', details));
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[source] = result.data;
    next();
  };
}
