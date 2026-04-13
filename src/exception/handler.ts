import { Response } from 'express';
import { ApiResponse } from '../model/types';
import { logger } from '../utils/logger';

export function sendSuccess<T>(res: Response, data: T, traceId: string): void {
  const body: ApiResponse<T> = {
    code: 'OK',
    message: 'success',
    traceId,
    data,
  };
  res.json(body);
}

export function sendError(
  res: Response,
  httpStatus: number,
  code: string,
  message: string,
  traceId: string,
  retryable = false,
  suggestion?: string
): void {
  const body: ApiResponse<never> = {
    code,
    message,
    traceId,
    retryable,
    suggestion,
  };
  res.status(httpStatus).json(body);
}

/**
 * Express 全局错误处理中间件
 */
export function globalErrorHandler(err: Error, _req: any, res: Response, _next: any): void {
  const traceId = res.locals.traceId ?? 'unknown';
  logger.error('Unhandled error', { error: err.message, stack: err.stack, traceId });

  if (err.name === 'ZodError') {
    sendError(res, 400, 'INVALID_PARAM', (err as any).issues?.[0]?.message ?? '参数校验失败', traceId);
    return;
  }

  sendError(res, 500, 'INTERNAL_ERROR', '服务内部错误', traceId, true, '请稍后重试');
}

export class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'UPSTREAM_TIMEOUT',
    public readonly httpStatus: number = 502
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}
