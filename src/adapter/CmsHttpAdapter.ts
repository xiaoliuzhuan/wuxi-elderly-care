import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  circuitBreaker,
  handleAll,
  ConsecutiveBreaker,
  CircuitBreakerPolicy,
} from 'cockatiel';
import { CmsReadOnlyAdapter } from './CmsReadOnlyAdapter';
import {
  CmsActivitiesResponse,
  CmsCoursesResponse,
  CmsClubsResponse,
  CmsMealPointsResponse,
  CmsHomeCareStationsResponse,
} from '../model/types';
import { config } from '../config';
import { UpstreamError } from '../exception/handler';
import { logger } from '../utils/logger';

export class CmsHttpAdapter implements CmsReadOnlyAdapter {
  private readonly client: AxiosInstance;
  private readonly breaker: CircuitBreakerPolicy;

  constructor() {
    this.client = axios.create({
      baseURL: config.cms.baseUrl,
      timeout: config.cms.timeoutMs,
    });

    this.client.interceptors.request.use((reqConfig: InternalAxiosRequestConfig) => {
      if (reqConfig.method && reqConfig.method.toUpperCase() !== 'GET') {
        throw new Error(`CMS adapter 禁止非 GET 请求: ${reqConfig.method}`);
      }
      if (config.cms.token) {
        reqConfig.headers.set('X-Internal-Token', config.cms.token);
      }
      return reqConfig;
    });

    this.breaker = circuitBreaker(handleAll, {
      halfOpenAfter: config.resilience.halfOpenAfterMs,
      breaker: new ConsecutiveBreaker(config.resilience.failureThreshold),
    });

    this.breaker.onBreak(() => logger.warn('CMS circuit breaker OPEN'));
    this.breaker.onHalfOpen(() => logger.info('CMS circuit breaker HALF-OPEN'));
    this.breaker.onReset(() => logger.info('CMS circuit breaker CLOSED'));
  }

  async getActivities(date?: string, community?: string, category?: string[]): Promise<CmsActivitiesResponse> {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (community) params.community = community;
    if (category?.length) params.category = category.join(',');
    return this.request<CmsActivitiesResponse>('/activities', params);
  }

  async getCourses(community?: string, category?: string[]): Promise<CmsCoursesResponse> {
    const params: Record<string, string> = {};
    if (community) params.community = community;
    if (category?.length) params.category = category.join(',');
    return this.request<CmsCoursesResponse>('/courses', params);
  }

  async getClubs(community?: string, category?: string[]): Promise<CmsClubsResponse> {
    const params: Record<string, string> = {};
    if (community) params.community = community;
    if (category?.length) params.category = category.join(',');
    return this.request<CmsClubsResponse>('/clubs', params);
  }

  async getMealPoints(district?: string, street?: string): Promise<CmsMealPointsResponse> {
    const params: Record<string, string> = {};
    if (district) params.district = district;
    if (street) params.street = street;
    return this.request<CmsMealPointsResponse>('/meal-points', params);
  }

  async getHomeCareStations(district?: string, street?: string, service?: string): Promise<CmsHomeCareStationsResponse> {
    const params: Record<string, string> = {};
    if (district) params.district = district;
    if (street) params.street = street;
    if (service) params.service = service;
    return this.request<CmsHomeCareStationsResponse>('/home-care-stations', params);
  }

  private async request<T>(path: string, params: Record<string, string>): Promise<T> {
    try {
      const result = await this.breaker.execute(() =>
        this.client.get<T>(path, { params })
      );
      return result.data;
    } catch (err: any) {
      if (err.isBrokenCircuitError || err.message?.includes('Breaker')) {
        throw new UpstreamError('CMS 服务熔断中，请稍后重试', 'UPSTREAM_CIRCUIT_OPEN', 503);
      }
      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        throw new UpstreamError('CMS 请求超时', 'UPSTREAM_TIMEOUT', 504);
      }
      throw new UpstreamError(`CMS 请求失败: ${err.message}`, 'UPSTREAM_ERROR', 502);
    }
  }
}
