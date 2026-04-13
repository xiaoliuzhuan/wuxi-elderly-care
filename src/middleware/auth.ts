import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { ChannelConfig } from '../model/types';
import { sendError } from '../exception/handler';

/**
 * Bearer Token 鉴权 + 渠道校验中间件
 * 从 Authorization 头提取 token，匹配渠道配置
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'UNAUTHORIZED', '缺少有效的 Authorization 头', res.locals.traceId);
    return;
  }

  const token = authHeader.slice(7);
  const channel = (config.channels as ChannelConfig[]).find((c) => c.token === token);

  if (!channel) {
    sendError(res, 401, 'UNAUTHORIZED', 'Token 无效', res.locals.traceId);
    return;
  }

  if (!channel.enabled) {
    sendError(res, 403, 'FORBIDDEN_CHANNEL', '该渠道已禁用', res.locals.traceId);
    return;
  }

  // 校验 X-Channel-Id 与 token 对应的渠道一致
  const channelId = req.headers['x-channel-id'] as string;
  if (channelId && channelId !== channel.channelId) {
    sendError(res, 403, 'FORBIDDEN_CHANNEL', '渠道标识与 Token 不匹配', res.locals.traceId);
    return;
  }

  res.locals.channel = channel;
  next();
}
