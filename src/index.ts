import express from 'express';
import { config } from './config';
import { traceIdMiddleware } from './middleware/traceId';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { statsMiddleware, stats } from './middleware/stats';
import { globalErrorHandler } from './exception/handler';
import { createElderlyRouter } from './controller/ElderlyController';
import { ElderlyService } from './service/ElderlyService';
import { logger } from './utils/logger';

export function createApp(service?: ElderlyService): express.Application {
  const app = express();

  app.use(express.json());
  app.use(traceIdMiddleware);
  app.use(statsMiddleware);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/stats', (_req, res) => {
    res.json(stats.getReport());
  });

  app.use('/openapi', authMiddleware);
  app.use('/openapi', rateLimitMiddleware);

  const elderlyService = service ?? new ElderlyService();
  app.use('/openapi/v1/elderly', createElderlyRouter(elderlyService));

  app.use(globalErrorHandler);

  return app;
}

if (require.main === module) {
  const app = createApp();
  app.listen(config.port, () => {
    logger.info(`Elderly Care Skill REST API started on port ${config.port}`);
  });
}
