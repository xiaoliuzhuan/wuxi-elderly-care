import { Router, Request, Response, NextFunction } from 'express';
import { ElderlyService } from '../service/ElderlyService';
import {
  activitiesQuerySchema,
  coursesQuerySchema,
  clubsQuerySchema,
  mealPointsQuerySchema,
  homeCareStationsQuerySchema,
} from '../config';
import { sendSuccess, sendError, UpstreamError } from '../exception/handler';
import { logger } from '../utils/logger';

export function createElderlyRouter(service: ElderlyService): Router {
  const router = Router();

  // GET /openapi/v1/elderly/activities
  router.get('/activities', async (req: Request, res: Response, next: NextFunction) => {
    const traceId = res.locals.traceId;
    try {
      const parsed = activitiesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendError(res, 400, 'INVALID_PARAM', parsed.error.issues[0].message, traceId);
        return;
      }
      const { date, community, category } = parsed.data;
      const data = await service.getActivities(date, community, category);
      logger.info('activities query', { traceId, date, community, category });
      sendSuccess(res, data, traceId);
    } catch (err) {
      handleServiceError(err, res, traceId, next);
    }
  });

  // GET /openapi/v1/elderly/courses
  router.get('/courses', async (req: Request, res: Response, next: NextFunction) => {
    const traceId = res.locals.traceId;
    try {
      const parsed = coursesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendError(res, 400, 'INVALID_PARAM', parsed.error.issues[0].message, traceId);
        return;
      }
      const { community, category } = parsed.data;
      const data = await service.getCourses(community, category);
      logger.info('courses query', { traceId, community, category });
      sendSuccess(res, data, traceId);
    } catch (err) {
      handleServiceError(err, res, traceId, next);
    }
  });

  // GET /openapi/v1/elderly/clubs
  router.get('/clubs', async (req: Request, res: Response, next: NextFunction) => {
    const traceId = res.locals.traceId;
    try {
      const parsed = clubsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendError(res, 400, 'INVALID_PARAM', parsed.error.issues[0].message, traceId);
        return;
      }
      const { community, category } = parsed.data;
      const data = await service.getClubs(community, category);
      logger.info('clubs query', { traceId, community, category });
      sendSuccess(res, data, traceId);
    } catch (err) {
      handleServiceError(err, res, traceId, next);
    }
  });

  // GET /openapi/v1/elderly/meal-points
  router.get('/meal-points', async (req: Request, res: Response, next: NextFunction) => {
    const traceId = res.locals.traceId;
    try {
      const parsed = mealPointsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendError(res, 400, 'INVALID_PARAM', parsed.error.issues[0].message, traceId);
        return;
      }
      const { district, street } = parsed.data;
      const data = await service.getMealPoints(district, street);
      logger.info('meal-points query', { traceId, district, street });
      sendSuccess(res, data, traceId);
    } catch (err) {
      handleServiceError(err, res, traceId, next);
    }
  });

  // GET /openapi/v1/elderly/home-care-stations
  router.get('/home-care-stations', async (req: Request, res: Response, next: NextFunction) => {
    const traceId = res.locals.traceId;
    try {
      const parsed = homeCareStationsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendError(res, 400, 'INVALID_PARAM', parsed.error.issues[0].message, traceId);
        return;
      }
      const { district, street, service: svc } = parsed.data;
      const data = await service.getHomeCareStations(district, street, svc);
      logger.info('home-care-stations query', { traceId, district, street, service: svc });
      sendSuccess(res, data, traceId);
    } catch (err) {
      handleServiceError(err, res, traceId, next);
    }
  });

  return router;
}

function handleServiceError(err: unknown, res: Response, traceId: string, next: NextFunction): void {
  if (err instanceof UpstreamError) {
    sendError(res, err.httpStatus, err.code, err.message, traceId, true, '请稍后重试');
    return;
  }
  next(err);
}
