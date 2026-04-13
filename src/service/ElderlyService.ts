import Redis from 'ioredis';
import { CmsReadOnlyAdapter } from '../adapter/CmsReadOnlyAdapter';
import { CmsHttpAdapter } from '../adapter/CmsHttpAdapter';
import { MockCmsAdapter } from '../adapter/MockCmsAdapter';
import { ZhiQueCmsAdapter } from '../adapter/ZhiQueCmsAdapter';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  ActivitiesResponse,
  CoursesResponse,
  ClubsResponse,
  MealPointsResponse,
  HomeCareStationsResponse,
} from '../model/types';

export class ElderlyService {
  private readonly cms: CmsReadOnlyAdapter;
  private readonly redis: Redis | null;

  constructor(cmsAdapter?: CmsReadOnlyAdapter, redis?: Redis | null) {
    this.cms = cmsAdapter ?? createDefaultAdapter();
    if (redis !== undefined) {
      this.redis = redis;
    } else if (!config.redis.enabled) {
      this.redis = null;
    } else {
      try {
        this.redis = new Redis(config.redis.url, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          enableOfflineQueue: false,
        });
        this.redis.on('error', (err) =>
          logger.warn('Redis connection error, running without cache', { error: err.message })
        );
      } catch {
        this.redis = null;
      }
    }
  }

  async getActivities(date?: string, community?: string, category?: string[]): Promise<ActivitiesResponse> {
    const queryDate = date ?? todayStr();
    const cacheKey = this.key('activities', queryDate, community ?? 'all', category?.sort().join(',') ?? 'all');
    const cached = await this.getCache<ActivitiesResponse>(cacheKey);
    if (cached) return cached;

    const cms = await this.cms.getActivities(queryDate, community, category);
    const result: ActivitiesResponse = { date: queryDate, activities: cms.activities, totalCount: cms.activities.length };
    await this.setCache(cacheKey, result, config.cacheTtl.activities);
    return result;
  }

  async getCourses(community?: string, category?: string[]): Promise<CoursesResponse> {
    const cacheKey = this.key('courses', community ?? 'all', category?.sort().join(',') ?? 'all');
    const cached = await this.getCache<CoursesResponse>(cacheKey);
    if (cached) return cached;

    const cms = await this.cms.getCourses(community, category);
    const result: CoursesResponse = { courses: cms.courses, totalCount: cms.courses.length };
    await this.setCache(cacheKey, result, config.cacheTtl.courses);
    return result;
  }

  async getClubs(community?: string, category?: string[]): Promise<ClubsResponse> {
    const cacheKey = this.key('clubs', community ?? 'all', category?.sort().join(',') ?? 'all');
    const cached = await this.getCache<ClubsResponse>(cacheKey);
    if (cached) return cached;

    const cms = await this.cms.getClubs(community, category);
    const result: ClubsResponse = { clubs: cms.clubs, totalCount: cms.clubs.length };
    await this.setCache(cacheKey, result, config.cacheTtl.clubs);
    return result;
  }

  async getMealPoints(district?: string, street?: string): Promise<MealPointsResponse> {
    const cacheKey = this.key('meal', district ?? 'all', street ?? 'all');
    const cached = await this.getCache<MealPointsResponse>(cacheKey);
    if (cached) return cached;

    const cms = await this.cms.getMealPoints(district, street);
    const result: MealPointsResponse = { points: cms.points, totalCount: cms.points.length };
    await this.setCache(cacheKey, result, config.cacheTtl.mealPoints);
    return result;
  }

  async getHomeCareStations(district?: string, street?: string, service?: string): Promise<HomeCareStationsResponse> {
    const cacheKey = this.key('stations', district ?? 'all', street ?? 'all', service ?? 'all');
    const cached = await this.getCache<HomeCareStationsResponse>(cacheKey);
    if (cached) return cached;

    const cms = await this.cms.getHomeCareStations(district, street, service);
    const result: HomeCareStationsResponse = { stations: cms.stations, totalCount: cms.stations.length };
    await this.setCache(cacheKey, result, config.cacheTtl.homeCareStations);
    return result;
  }

  private key(...parts: string[]): string {
    return config.redis.keyPrefix + parts.join(':');
  }

  private async getCache<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err: any) {
      logger.warn('Redis get failed', { key, error: err.message });
      return null;
    }
  }

  private async setCache(key: string, value: unknown, ttlSec: number): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSec);
    } catch (err: any) {
      logger.warn('Redis set failed', { key, error: err.message });
    }
  }
}

function todayStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createDefaultAdapter(): CmsReadOnlyAdapter {
  if (config.cms.provider === 'mock') return new MockCmsAdapter();
  if (config.cms.provider === 'zhique') return new ZhiQueCmsAdapter();
  return new CmsHttpAdapter();
}
