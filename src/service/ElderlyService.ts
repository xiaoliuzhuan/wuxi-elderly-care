import Redis from 'ioredis';
import { CmsReadOnlyAdapter } from '../adapter/CmsReadOnlyAdapter';
import { CmsHttpAdapter } from '../adapter/CmsHttpAdapter';
import { MockCmsAdapter } from '../adapter/MockCmsAdapter';
import { ZhiQueCmsAdapter } from '../adapter/ZhiQueCmsAdapter';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  ActivitiesResponse,
  ClubsResponse,
  CoursesResponse,
  HomeCareStationsResponse,
  MealPointsResponse,
  QueryFilterValue,
  QueryResolutionMeta,
} from '../model/types';

type QueryFilters = Record<string, QueryFilterValue | undefined>;

interface QueryAttempt<T> {
  appliedFilters: QueryFilters;
  load: () => Promise<T[]>;
  fallbackStrategy?: string;
  note?: string;
}

interface QuerySelection<T> {
  items: T[];
  meta: QueryResolutionMeta;
}

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
    const cacheKey = this.key(
      'activities',
      queryDate,
      community ?? 'all',
      category ? [...category].sort().join(',') : 'all'
    );
    const cached = await this.getCache<ActivitiesResponse>(cacheKey);
    if (cached) return cached;

    const { items, meta } = await resolveWithFallback(
      { date: queryDate, community, category },
      [
        {
          appliedFilters: { date: queryDate, community, category },
          load: async () => (await this.cms.getActivities(queryDate, community, category)).activities,
        },
        community
          ? {
              appliedFilters: { date: queryDate, category },
              load: async () => (await this.cms.getActivities(queryDate, undefined, category)).activities,
              fallbackStrategy: 'drop_community_keep_date',
              note: '指定社区暂无活动，已回退到同日期的可查活动。',
            }
          : undefined,
        category?.length
          ? {
              appliedFilters: { date: queryDate, community },
              load: async () => (await this.cms.getActivities(queryDate, community, undefined)).activities,
              fallbackStrategy: community ? 'drop_category_keep_date_and_community' : 'drop_category_keep_date',
              note: '指定活动分类暂无命中，已回退到同日期的其他活动。',
            }
          : undefined,
        community || category?.length
          ? {
              appliedFilters: { date: queryDate },
              load: async () => (await this.cms.getActivities(queryDate, undefined, undefined)).activities,
              fallbackStrategy: 'date_only',
              note: '指定社区或分类未命中，已回退到同日期的可查活动。',
            }
          : undefined,
        community || category?.length
          ? {
              appliedFilters: {},
              load: async () => (await this.cms.getActivities(undefined, undefined, undefined)).activities,
              fallbackStrategy: 'any_upcoming',
              note: '指定社区或分类未命中，已回退到当前平台可查到的近期活动。',
            }
          : undefined,
      ]
    );

    const result: ActivitiesResponse = {
      date: queryDate,
      activities: items,
      totalCount: items.length,
      meta,
    };
    await this.setCache(cacheKey, result, config.cacheTtl.activities);
    return result;
  }

  async getCourses(community?: string, category?: string[]): Promise<CoursesResponse> {
    const cacheKey = this.key(
      'courses',
      community ?? 'all',
      category ? [...category].sort().join(',') : 'all'
    );
    const cached = await this.getCache<CoursesResponse>(cacheKey);
    if (cached) return cached;

    const { items, meta } = await resolveWithFallback(
      { community, category },
      [
        {
          appliedFilters: { community, category },
          load: async () => (await this.cms.getCourses(community, category)).courses,
        },
        community
          ? {
              appliedFilters: { category },
              load: async () => (await this.cms.getCourses(undefined, category)).courses,
              fallbackStrategy: 'drop_community',
              note: '指定社区暂无课程，已回退到全市范围内的同类课程。',
            }
          : undefined,
        category?.length
          ? {
              appliedFilters: { community },
              load: async () => (await this.cms.getCourses(community, undefined)).courses,
              fallbackStrategy: community ? 'drop_category_keep_community' : 'drop_category',
              note: '指定课程分类暂无命中，已回退到更宽松的课程列表。',
            }
          : undefined,
        community || category?.length
          ? {
              appliedFilters: {},
              load: async () => (await this.cms.getCourses(undefined, undefined)).courses,
              fallbackStrategy: 'all_courses',
              note: '指定条件暂无命中，已回退到当前可查课程列表。',
            }
          : undefined,
      ]
    );

    const result: CoursesResponse = {
      courses: items,
      totalCount: items.length,
      meta,
    };
    await this.setCache(cacheKey, result, config.cacheTtl.courses);
    return result;
  }

  async getClubs(community?: string, category?: string[]): Promise<ClubsResponse> {
    const cacheKey = this.key(
      'clubs',
      community ?? 'all',
      category ? [...category].sort().join(',') : 'all'
    );
    const cached = await this.getCache<ClubsResponse>(cacheKey);
    if (cached) return cached;

    const { items, meta } = await resolveWithFallback(
      { community, category },
      [
        {
          appliedFilters: { community, category },
          load: async () => (await this.cms.getClubs(community, category)).clubs,
        },
        community
          ? {
              appliedFilters: { category },
              load: async () => (await this.cms.getClubs(undefined, category)).clubs,
              fallbackStrategy: 'drop_community',
              note: '指定社区暂无社团，已回退到更大范围的同类社团。',
            }
          : undefined,
        category?.length
          ? {
              appliedFilters: { community },
              load: async () => (await this.cms.getClubs(community, undefined)).clubs,
              fallbackStrategy: community ? 'drop_category_keep_community' : 'drop_category',
              note: '指定社团分类暂无命中，已回退到更宽松的社团列表。',
            }
          : undefined,
        community || category?.length
          ? {
              appliedFilters: {},
              load: async () => (await this.cms.getClubs(undefined, undefined)).clubs,
              fallbackStrategy: 'all_clubs',
              note: '指定条件暂无命中，已回退到当前可查社团列表。',
            }
          : undefined,
      ]
    );

    const result: ClubsResponse = {
      clubs: items,
      totalCount: items.length,
      meta,
    };
    await this.setCache(cacheKey, result, config.cacheTtl.clubs);
    return result;
  }

  async getMealPoints(district?: string, street?: string): Promise<MealPointsResponse> {
    const cacheKey = this.key('meal', district ?? 'all', street ?? 'all');
    const cached = await this.getCache<MealPointsResponse>(cacheKey);
    if (cached) return cached;

    const { items, meta } = await resolveWithFallback(
      { district, street },
      [
        {
          appliedFilters: { district, street },
          load: async () => (await this.cms.getMealPoints(district, street)).points,
        },
        district && street
          ? {
              appliedFilters: { street },
              load: async () => (await this.cms.getMealPoints(undefined, street)).points,
              fallbackStrategy: 'street_only',
              note: '地址文本没有同时命中区县和街道，已回退到街道级助餐点查询。',
            }
          : undefined,
        district && street
          ? {
              appliedFilters: { district },
              load: async () => (await this.cms.getMealPoints(district, undefined)).points,
              fallbackStrategy: 'district_only',
              note: '地址文本没有同时命中区县和街道，已回退到区县级助餐点查询。',
            }
          : undefined,
      ]
    );

    const result: MealPointsResponse = {
      points: items,
      totalCount: items.length,
      meta,
    };
    await this.setCache(cacheKey, result, config.cacheTtl.mealPoints);
    return result;
  }

  async getHomeCareStations(district?: string, street?: string, service?: string): Promise<HomeCareStationsResponse> {
    const cacheKey = this.key('stations', district ?? 'all', street ?? 'all', service ?? 'all');
    const cached = await this.getCache<HomeCareStationsResponse>(cacheKey);
    if (cached) return cached;

    const { items, meta } = await resolveWithFallback(
      { district, street, service },
      [
        {
          appliedFilters: { district, street, service },
          load: async () => (await this.cms.getHomeCareStations(district, street, service)).stations,
        },
        service
          ? {
              appliedFilters: { district, street },
              load: async () => (await this.cms.getHomeCareStations(district, street, undefined)).stations,
              fallbackStrategy: 'drop_service',
              note: '指定服务类型暂无命中，已回退到该区域的全部服务站。',
            }
          : undefined,
        district && street
          ? {
              appliedFilters: { street, service },
              load: async () => (await this.cms.getHomeCareStations(undefined, street, service)).stations,
              fallbackStrategy: 'street_only',
              note: '区域文本没有同时命中区县和街道，已回退到街道级服务站查询。',
            }
          : undefined,
        district && street
          ? {
              appliedFilters: { district, service },
              load: async () => (await this.cms.getHomeCareStations(district, undefined, service)).stations,
              fallbackStrategy: 'district_only',
              note: '区域文本没有同时命中区县和街道，已回退到区县级服务站查询。',
            }
          : undefined,
        district || street || service
          ? {
              appliedFilters: {},
              load: async () => (await this.cms.getHomeCareStations(undefined, undefined, undefined)).stations,
              fallbackStrategy: 'all_stations',
              note: '指定条件暂无命中，已回退到当前可查服务站列表。',
            }
          : undefined,
      ]
    );

    const result: HomeCareStationsResponse = {
      stations: items,
      totalCount: items.length,
      meta,
    };
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

async function resolveWithFallback<T>(
  requestedFilters: QueryFilters,
  attempts: Array<QueryAttempt<T> | undefined>
): Promise<QuerySelection<T>> {
  const normalizedRequested = normalizeFilters(requestedFilters);
  const uniqueAttempts = dedupeAttempts(attempts);

  let exactMatchCount = 0;
  let lastItems: T[] = [];

  for (let index = 0; index < uniqueAttempts.length; index += 1) {
    const attempt = uniqueAttempts[index];
    const items = await attempt.load();

    if (index === 0) {
      exactMatchCount = items.length;
    }

    lastItems = items;
    if (items.length > 0 || index === uniqueAttempts.length - 1) {
      const appliedFilters = normalizeFilters(attempt.appliedFilters);
      return {
        items,
        meta: {
          requestedFilters: normalizedRequested,
          appliedFilters,
          exactMatchCount,
          fallbackApplied: index > 0,
          droppedFilters: index > 0 ? findDroppedFilters(normalizedRequested, appliedFilters) : undefined,
          fallbackStrategy: index > 0 ? attempt.fallbackStrategy : undefined,
          note: index > 0 ? attempt.note : undefined,
        },
      };
    }
  }

  return {
    items: lastItems,
    meta: {
      requestedFilters: normalizedRequested,
      appliedFilters: normalizedRequested,
      exactMatchCount,
      fallbackApplied: false,
    },
  };
}

function dedupeAttempts<T>(attempts: Array<QueryAttempt<T> | undefined>): QueryAttempt<T>[] {
  const seen = new Set<string>();

  return attempts.filter(isDefined).filter((attempt) => {
    const key = JSON.stringify(normalizeFilters(attempt.appliedFilters));
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeFilters(filters: QueryFilters): Record<string, QueryFilterValue> {
  const normalized: Record<string, QueryFilterValue> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      const items = value.map((item) => item.trim()).filter(Boolean);
      if (items.length > 0) {
        normalized[key] = items;
      }
      continue;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      normalized[key] = value.trim();
    }
  }

  return normalized;
}

function findDroppedFilters(
  requestedFilters: Record<string, QueryFilterValue>,
  appliedFilters: Record<string, QueryFilterValue>
): string[] | undefined {
  const dropped = Object.keys(requestedFilters).filter((key) => !(key in appliedFilters));
  return dropped.length > 0 ? dropped : undefined;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
