import { Request, Response, NextFunction } from 'express';
import { ChannelConfig } from '../model/types';
import { sendError } from '../exception/handler';

// 简单的滑动窗口限流器（内存版，生产应使用 Redis）
const counters = new Map<string, { count: number; resetAt: number }>();

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const channel: ChannelConfig | undefined = res.locals.channel;
  if (!channel) {
    next();
    return;
  }

  const key = `rl:${channel.channelId}`;
  const now = Date.now();
  const windowMs = 1000;
  const limit = channel.rateLimit;

  let entry = counters.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    counters.set(key, entry);
  }

  entry.count++;

  const remaining = Math.max(0, limit - entry.count);
  const resetEpochSec = Math.ceil(entry.resetAt / 1000);

  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(resetEpochSec));

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(Math.max(retryAfter, 1)));
    sendError(res, 429, 'RATE_LIMITED', '请求频率超过限制，请稍后重试', res.locals.traceId, true, '请在 Retry-After 指定的秒数后重试');
    return;
  }

  next();
}
