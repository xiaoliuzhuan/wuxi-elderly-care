import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * traceId 中间件：从请求头 X-Trace-Id 获取或自动生成，注入 res.locals 并写入响应头
 */
export function traceIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const traceId = (req.headers['x-trace-id'] as string) || `trace_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
  res.locals.traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);
  next();
}
