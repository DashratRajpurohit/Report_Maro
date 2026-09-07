import type { Response } from 'express';
import { nanoid } from 'nanoid';
import type { ApiErrorCode, PaginationMeta } from '@sih/shared-types';
import { HTTP_STATUS_BY_ERROR_CODE } from '@sih/shared-types';

export function ok<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data });
}

export function okList<T>(res: Response, data: T[], pagination: PaginationMeta): void {
  res.status(200).json({ success: true, data, meta: { pagination } });
}

/** Thrown from anywhere in a route/service; caught by the error middleware. */
export class ApiError extends Error {
  code: ApiErrorCode;
  details?: { path: string; message: string }[];

  constructor(code: ApiErrorCode, message: string, details?: { path: string; message: string }[]) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export function sendApiError(res: Response, error: ApiError): void {
  res.status(HTTP_STATUS_BY_ERROR_CODE[error.code]).json({
    success: false,
    error: { code: error.code, message: error.message, details: error.details },
    requestId: res.locals.requestId ?? nanoid(),
  });
}

export function buildPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
