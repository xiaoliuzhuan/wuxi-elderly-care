import { Request, Response, NextFunction } from 'express';

interface ToolStats {
  totalCalls: number;
  successCount: number;
  errorCount: number;
  totalDurationMs: number;
  lastCalledAt: string | null;
  statusCodes: Record<number, number>;
}

interface ChannelStats {
  totalCalls: number;
  lastCalledAt: string | null;
}

class StatsCollector {
  private tools = new Map<string, ToolStats>();
  private channels = new Map<string, ChannelStats>();
  private startedAt = new Date().toISOString();

  recordCall(tool: string, channelId: string, statusCode: number, durationMs: number): void {
    // 按工具统计
    const t = this.tools.get(tool) ?? {
      totalCalls: 0, successCount: 0, errorCount: 0,
      totalDurationMs: 0, lastCalledAt: null, statusCodes: {},
    };
    t.totalCalls++;
    t.totalDurationMs += durationMs;
    t.lastCalledAt = new Date().toISOString();
    t.statusCodes[statusCode] = (t.statusCodes[statusCode] ?? 0) + 1;
    if (statusCode >= 200 && statusCode < 400) {
      t.successCount++;
    } else {
      t.errorCount++;
    }
    this.tools.set(tool, t);

    // 按渠道统计
    const c = this.channels.get(channelId) ?? { totalCalls: 0, lastCalledAt: null };
    c.totalCalls++;
    c.lastCalledAt = new Date().toISOString();
    this.channels.set(channelId, c);
  }

  getReport() {
    const toolStats: Record<string, ToolStats & { avgDurationMs: number }> = {};
    for (const [name, stats] of this.tools) {
      toolStats[name] = {
        ...stats,
        avgDurationMs: stats.totalCalls > 0 ? Math.round(stats.totalDurationMs / stats.totalCalls) : 0,
      };
    }

    const channelStats: Record<string, ChannelStats> = {};
    for (const [id, stats] of this.channels) {
      channelStats[id] = stats;
    }

    return {
      serverStartedAt: this.startedAt,
      uptime: `${Math.round((Date.now() - new Date(this.startedAt).getTime()) / 1000)}s`,
      tools: toolStats,
      channels: channelStats,
    };
  }
}

export const stats = new StatsCollector();

/**
 * 请求统计中间件：记录每个 API 调用的工具名、渠道、状态码、耗时
 */
export function statsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestPath = req.originalUrl.split('?')[0];

  res.on('finish', () => {
    // 从路径提取工具名
    if (!requestPath.startsWith('/openapi/')) return;

    const tool = requestPath.replace('/openapi/v1/elderly/', '') || 'unknown';
    const channelId = res.locals.channel?.channelId ?? 'anonymous';
    const duration = Date.now() - start;

    stats.recordCall(tool, channelId, res.statusCode, duration);
  });

  next();
}
