import request from 'supertest';
import { createApp } from '../index';
import { ElderlyService } from '../service/ElderlyService';
import { MockCmsAdapter } from '../adapter/MockCmsAdapter';

const service = new ElderlyService(new MockCmsAdapter(), null);
const app = createApp(service);

describe('Health check', () => {
  it('should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth middleware', () => {
  it('should return 401 without Authorization header', async () => {
    const res = await request(app).get('/openapi/v1/elderly/activities');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/openapi/v1/elderly/activities')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });
});

const auth = { Authorization: 'Bearer sk-default-dev-token' };

describe('GET /openapi/v1/elderly/activities', () => {
  it('should return activities', async () => {
    const res = await request(app).get('/openapi/v1/elderly/activities').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
    expect(res.body.data.activities.length).toBeGreaterThan(0);
    expect(res.body.data.totalCount).toBeGreaterThan(0);
    expect(res.body.data).toHaveProperty('meta');
    expect(res.body.data.meta).toHaveProperty('fallbackApplied');
    expect(res.body.data.activities[0]).toHaveProperty('activityId');
    expect(res.body.data.activities[0]).toHaveProperty('name');
    expect(res.body.data.activities[0]).toHaveProperty('community');
  });
});

describe('GET /openapi/v1/elderly/courses', () => {
  it('should return courses', async () => {
    const res = await request(app).get('/openapi/v1/elderly/courses').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
    expect(res.body.data.courses.length).toBeGreaterThan(0);
    expect(res.body.data.courses[0]).toHaveProperty('courseId');
    expect(res.body.data.courses[0]).toHaveProperty('instructor');
    expect(res.body.data.courses[0]).toHaveProperty('schedule');
  });
});

describe('GET /openapi/v1/elderly/clubs', () => {
  it('should return clubs', async () => {
    const res = await request(app).get('/openapi/v1/elderly/clubs').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
    expect(res.body.data.clubs.length).toBeGreaterThan(0);
    expect(res.body.data.clubs[0]).toHaveProperty('clubId');
    expect(res.body.data.clubs[0]).toHaveProperty('meetingSchedule');
  });
});

describe('GET /openapi/v1/elderly/meal-points', () => {
  it('should return meal service points', async () => {
    const res = await request(app).get('/openapi/v1/elderly/meal-points').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
    expect(res.body.data.points.length).toBeGreaterThan(0);
    expect(res.body.data).toHaveProperty('meta');
    expect(res.body.data.meta).toHaveProperty('fallbackApplied');
    expect(res.body.data.points[0]).toHaveProperty('pointId');
    expect(res.body.data.points[0]).toHaveProperty('address');
    expect(res.body.data.points[0]).toHaveProperty('phone');
    expect(res.body.data.points[0]).toHaveProperty('businessHours');
  });
});

describe('GET /openapi/v1/elderly/home-care-stations', () => {
  it('should return home care stations', async () => {
    const res = await request(app).get('/openapi/v1/elderly/home-care-stations').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('OK');
    expect(res.body.data.stations.length).toBeGreaterThan(0);
    expect(res.body.data.stations[0]).toHaveProperty('stationId');
    expect(res.body.data.stations[0]).toHaveProperty('services');
    expect(res.body.data.stations[0]).toHaveProperty('coverageArea');
  });
});

describe('Response headers', () => {
  it('should include X-Trace-Id', async () => {
    const res = await request(app).get('/openapi/v1/elderly/courses').set(auth);
    expect(res.headers['x-trace-id']).toBeDefined();
  });

  it('should include X-RateLimit-* headers', async () => {
    const res = await request(app).get('/openapi/v1/elderly/courses').set(auth);
    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
  });

  it('should echo back X-Trace-Id from request', async () => {
    const customTraceId = 'trace_elderly_test_123';
    const res = await request(app)
      .get('/openapi/v1/elderly/courses')
      .set(auth)
      .set('X-Trace-Id', customTraceId);
    expect(res.headers['x-trace-id']).toBe(customTraceId);
    expect(res.body.traceId).toBe(customTraceId);
  });
});

describe('Stats endpoint', () => {
  it('should return stats', async () => {
    await request(app).get('/openapi/v1/elderly/courses').set(auth);
    const res = await request(app).get('/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('serverStartedAt');
    expect(res.body).toHaveProperty('tools');
    expect(res.body.tools).toHaveProperty('courses');
  });
});
