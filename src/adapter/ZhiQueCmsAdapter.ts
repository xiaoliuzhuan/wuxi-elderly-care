import axios, { AxiosError, AxiosInstance } from 'axios';
import { createHash, randomUUID } from 'crypto';
import { CmsReadOnlyAdapter } from './CmsReadOnlyAdapter';
import {
  ActivityCategory,
  ActivityStatus,
  ClubCategory,
  CmsActivitiesResponse,
  CmsClubsResponse,
  CmsCoursesResponse,
  CmsHomeCareStationsResponse,
  CmsMealPointsResponse,
  CourseCategory,
  ElderlyActivity,
  ElderlyClub,
  ElderlyCourse,
  HomeCareStation,
  MealServicePoint,
  ServiceType,
} from '../model/types';
import { config } from '../config';
import { UpstreamError } from '../exception/handler';

interface ZhiQueApiResponse<T> {
  code: string;
  message?: string;
  data?: T;
}

interface RawActivity {
  id?: number | string;
  tospic?: string;
  tyspe?: string;
  siteName?: string;
  community?: string;
  address?: string;
  activeTime?: string;
  activeDec?: string;
}

interface RawCourse {
  id?: number | string;
  title?: string;
  type?: string;
  address?: string;
  classHour?: string;
  feeType?: string;
  intro?: string;
  needNum?: string;
  price?: string;
  resource?: string;
  schedule?: string;
}

interface RawClub {
  id?: number | string;
  title?: string;
  clubType?: string;
  siteName?: string;
  community?: string;
  address?: string;
  content?: string;
  leader?: string;
  schedule?: string;
  star?: number;
  userNum?: number;
}

interface RawMealPoint {
  id?: number | string;
  name?: string;
  telephone?: string;
  address?: string;
}

interface RawStation {
  id?: number | string;
  name?: string;
  labels?: string;
  address?: string;
  openTime?: string;
  remark?: string;
  image?: string;
}

export class ZhiQueCmsAdapter implements CmsReadOnlyAdapter {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.zhique.baseUrl,
      timeout: config.zhique.timeoutMs,
    });
  }

  async getActivities(date?: string, community?: string, category?: string[]): Promise<CmsActivitiesResponse> {
    const fetchedAt = new Date().toISOString();
    const activities = await this.postList<RawActivity>('/api/foreign-api/activity/list');
    const filtered = activities
      .filter((activity) =>
        (!date || activity.activeTime?.startsWith(date)) &&
        matchesText(activity.community, community) &&
        matchesCategory(activity.tyspe, category, activityCategoryAliases)
      )
      .map((activity) => mapActivity(activity, fetchedAt));

    return { activities: filtered };
  }

  async getCourses(community?: string, category?: string[]): Promise<CmsCoursesResponse> {
    const fetchedAt = new Date().toISOString();
    const courses = await this.postList<RawCourse>('/api/foreign-api/course/list');
    const filtered = courses
      .filter((course) =>
        matchesText(course.address, community) &&
        matchesCategory(course.type, category, courseCategoryAliases)
      )
      .map((course) => mapCourse(course, fetchedAt));

    return { courses: filtered };
  }

  async getClubs(community?: string, category?: string[]): Promise<CmsClubsResponse> {
    const fetchedAt = new Date().toISOString();
    const clubs = await this.postList<RawClub>('/api/foreign-api/club/list');
    const filtered = clubs
      .filter((club) =>
        matchesText(club.community, community) &&
        matchesCategory(club.clubType, category, clubCategoryAliases)
      )
      .map((club) => mapClub(club, fetchedAt));

    return { clubs: filtered };
  }

  async getMealPoints(district?: string, street?: string): Promise<CmsMealPointsResponse> {
    const fetchedAt = new Date().toISOString();
    const points = await this.postList<RawMealPoint>('/api/foreign-api/foodsite/list');
    const filtered = points
      .filter((point) =>
        matchesText(point.address, district) &&
        matchesText(point.address, street)
      )
      .map((point) => mapMealPoint(point, fetchedAt));

    return { points: filtered };
  }

  async getHomeCareStations(district?: string, street?: string, service?: string): Promise<CmsHomeCareStationsResponse> {
    const fetchedAt = new Date().toISOString();
    const stations = await this.postList<RawStation>('/api/foreign-api/site/list');
    const filtered = stations
      .filter((station) =>
        matchesText(station.address, district) &&
        matchesText(station.address, street) &&
        matchesCategory(`${station.labels ?? ''} ${station.remark ?? ''}`, service ? [service] : undefined, stationServiceAliases)
      )
      .map((station) => mapStation(station, fetchedAt));

    return { stations: filtered };
  }

  private async postList<T>(path: string): Promise<T[]> {
    validateZhiQueConfig();

    const body = { orgcode: config.zhique.orgCode };
    const bodyJson = JSON.stringify(body);

    try {
      const response = await this.client.post<ZhiQueApiResponse<T[]>>(path, body, {
        headers: createSignedHeaders(bodyJson),
      });

      if (response.data.code !== '1000') {
        throw new UpstreamError(
          `知鹊接口返回错误: [${response.data.code}] ${response.data.message ?? ''}`.trim(),
          'UPSTREAM_ERROR',
          502
        );
      }

      return response.data.data ?? [];
    } catch (error) {
      throw convertAxiosError(error);
    }
  }
}

function validateZhiQueConfig(): void {
  if (config.zhique.appId && config.zhique.appSecret && config.zhique.orgCode) {
    return;
  }

  throw new UpstreamError(
    '缺少本 skill 的知鹊接入配置，请设置 ELDERLY_SKILL_ACCESS_TOKEN，或回退到 ZHIQUE_APP_ID、ZHIQUE_APP_SECRET、ZHIQUE_ORG_CODE',
    'UPSTREAM_CONFIG_MISSING',
    500
  );
}

function createSignedHeaders(bodyJson: string): Record<string, string> {
  const timestamp = Date.now().toString();
  const nonce = randomUUID();
  const signedText = `${bodyJson}appId=${config.zhique.appId}&nonce=${nonce}&timestamp=${timestamp}${config.zhique.appSecret}`;
  const sign = createHash('sha256').update(signedText, 'utf8').digest('hex');

  return {
    appId: config.zhique.appId,
    timestamp,
    nonce,
    sign,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(bodyJson).toString(),
  };
}

function convertAxiosError(error: unknown): UpstreamError {
  if (error instanceof UpstreamError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{ message?: string }>;
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return new UpstreamError('知鹊接口请求超时', 'UPSTREAM_TIMEOUT', 504);
    }

    const status = err.response?.status;
    const message = err.response?.data?.message ?? err.message;
    if (status) {
      return new UpstreamError(`知鹊接口请求失败: ${message}`, 'UPSTREAM_ERROR', 502);
    }
  }

  const message = error instanceof Error ? error.message : '未知错误';
  return new UpstreamError(`知鹊接口请求失败: ${message}`, 'UPSTREAM_ERROR', 502);
}

function mapActivity(raw: RawActivity, fetchedAt: string): ElderlyActivity {
  return {
    activityId: stringifyId(raw.id, 'activity'),
    name: raw.tospic?.trim() || raw.siteName?.trim() || '未命名活动',
    category: mapActivityCategory(raw.tyspe),
    description: raw.activeDec?.trim() || '暂无活动详情',
    startTime: raw.activeTime?.trim() || fetchedAt,
    endTime: raw.activeTime?.trim() || fetchedAt,
    location: raw.address?.trim() || raw.siteName?.trim() || raw.community?.trim() || '地点待确认',
    community: raw.community?.trim() || raw.siteName?.trim() || '社区待确认',
    organizer: raw.siteName?.trim() || raw.community?.trim() || '知鹊平台',
    targetAge: '60+',
    status: inferActivityStatus(raw.activeTime),
    lastUpdatedAt: fetchedAt,
  };
}

function mapCourse(raw: RawCourse, fetchedAt: string): ElderlyCourse {
  return {
    courseId: stringifyId(raw.id, 'course'),
    name: raw.title?.trim() || '未命名课程',
    category: mapCourseCategory(raw.type),
    description: raw.intro?.trim() || '暂无课程详情',
    instructor: raw.resource?.trim() || '待确认',
    schedule: raw.schedule?.trim() || raw.classHour?.trim() || '待确认',
    location: raw.address?.trim() || '地点待确认',
    community: raw.address?.trim() || '区域待确认',
    semester: '当前开放',
    totalSessions: parseOptionalInt(raw.classHour) ?? 0,
    remainingSlots: parseOptionalInt(raw.needNum) ?? 0,
    fee: raw.price?.trim() || raw.feeType?.trim() || '待确认',
    status: 'ENROLLING',
    lastUpdatedAt: fetchedAt,
  };
}

function mapClub(raw: RawClub, fetchedAt: string): ElderlyClub {
  return {
    clubId: stringifyId(raw.id, 'club'),
    name: raw.title?.trim() || '未命名社团',
    category: mapClubCategory(raw.clubType),
    description: raw.content?.trim() || '暂无社团详情',
    meetingSchedule: raw.schedule?.trim() || '待确认',
    meetingLocation: raw.address?.trim() || raw.siteName?.trim() || '地点待确认',
    community: raw.community?.trim() || raw.siteName?.trim() || '社区待确认',
    memberCount: raw.userNum ?? 0,
    leader: raw.leader?.trim() || '待确认',
    isRecruiting: true,
    fee: '待确认',
    lastUpdatedAt: fetchedAt,
  };
}

function mapMealPoint(raw: RawMealPoint, fetchedAt: string): MealServicePoint {
  const address = raw.address?.trim() || '地址待确认';

  return {
    pointId: stringifyId(raw.id, 'meal'),
    name: raw.name?.trim() || '未命名助餐点',
    address,
    district: extractArea(address, districtKeywords),
    street: extractArea(address, streetKeywords),
    community: extractArea(address, communityKeywords),
    phone: raw.telephone?.trim() || '待确认',
    businessHours: '待确认',
    mealTypes: ['午餐'],
    priceRange: '待确认',
    status: 'OPEN',
    lastUpdatedAt: fetchedAt,
  };
}

function mapStation(raw: RawStation, fetchedAt: string): HomeCareStation {
  const features = splitLabels(raw.labels);

  return {
    stationId: stringifyId(raw.id, 'station'),
    name: raw.name?.trim() || '未命名服务站',
    address: raw.address?.trim() || '地址待确认',
    district: extractArea(raw.address, districtKeywords),
    street: extractArea(raw.address, streetKeywords),
    community: extractArea(raw.address, communityKeywords),
    phone: '待确认',
    businessHours: raw.openTime?.trim() || '待确认',
    services: inferServices(raw.labels, raw.remark),
    serviceDescription: raw.remark?.trim() || raw.labels?.trim() || '暂无服务说明',
    coverageArea: raw.address?.trim() || '覆盖范围待确认',
    operator: '知鹊平台',
    features,
    status: 'OPEN',
    lastUpdatedAt: fetchedAt,
  };
}

function stringifyId(value: string | number | undefined, prefix: string): string {
  if (value !== undefined && value !== null && String(value).trim() !== '') {
    return String(value);
  }
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

function matchesText(value: string | undefined, query: string | undefined): boolean {
  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return (value ?? '').toLowerCase().includes(normalizedQuery);
}

function matchesCategory(
  value: string | undefined,
  queries: string[] | undefined,
  aliases: Record<string, string[]>
): boolean {
  if (!queries?.length) return true;

  const haystack = (value ?? '').toLowerCase();
  return queries.some((query) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return false;
    const terms = [normalized, ...(aliases[normalized] ?? [])];
    return terms.some((term) => haystack.includes(term.toLowerCase()));
  });
}

function mapActivityCategory(value: string | undefined): ActivityCategory {
  const normalized = (value ?? '').toLowerCase();
  if (matchesAlias(normalized, activityCategoryAliases.culture)) return 'culture';
  if (matchesAlias(normalized, activityCategoryAliases.sports)) return 'sports';
  if (matchesAlias(normalized, activityCategoryAliases.health)) return 'health';
  if (matchesAlias(normalized, activityCategoryAliases.social)) return 'social';
  return 'other';
}

function mapCourseCategory(value: string | undefined): CourseCategory {
  const normalized = (value ?? '').toLowerCase();
  if (matchesAlias(normalized, courseCategoryAliases.calligraphy)) return 'calligraphy';
  if (matchesAlias(normalized, courseCategoryAliases.painting)) return 'painting';
  if (matchesAlias(normalized, courseCategoryAliases.music)) return 'music';
  if (matchesAlias(normalized, courseCategoryAliases.dance)) return 'dance';
  if (matchesAlias(normalized, courseCategoryAliases.digital)) return 'digital';
  if (matchesAlias(normalized, courseCategoryAliases.health)) return 'health';
  if (matchesAlias(normalized, courseCategoryAliases.handicraft)) return 'handicraft';
  return 'other';
}

function mapClubCategory(value: string | undefined): ClubCategory {
  const normalized = (value ?? '').toLowerCase();
  if (matchesAlias(normalized, clubCategoryAliases.tai_chi)) return 'tai_chi';
  if (matchesAlias(normalized, clubCategoryAliases.dance)) return 'dance';
  if (matchesAlias(normalized, clubCategoryAliases.chess)) return 'chess';
  if (matchesAlias(normalized, clubCategoryAliases.singing)) return 'singing';
  if (matchesAlias(normalized, clubCategoryAliases.photography)) return 'photography';
  if (matchesAlias(normalized, clubCategoryAliases.gardening)) return 'gardening';
  if (matchesAlias(normalized, clubCategoryAliases.reading)) return 'reading';
  return 'other';
}

function inferActivityStatus(value: string | undefined): ActivityStatus {
  if (!value) return 'UPCOMING';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'UPCOMING';
  return date.getTime() < Date.now() ? 'ONGOING' : 'UPCOMING';
}

function parseOptionalInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = value.match(/\d+/);
  if (!match) return undefined;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function splitLabels(value: string | undefined): string[] {
  return (value ?? '')
    .split(/[;,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferServices(labels?: string, remark?: string): ServiceType[] {
  const haystack = `${labels ?? ''} ${remark ?? ''}`.toLowerCase();
  const matches = serviceTypes.filter(({ service, aliases }) =>
    aliases.some((alias) => haystack.includes(alias.toLowerCase()))
  );

  return matches.length > 0 ? matches.map((item) => item.service) : ['daily_care'];
}

function extractArea(address: string | undefined, keywords: string[]): string {
  const haystack = address ?? '';
  const matched = keywords.find((keyword) => haystack.includes(keyword));
  return matched ?? '待确认';
}

function matchesAlias(value: string, aliases: string[]): boolean {
  return aliases.some((alias) => value.includes(alias.toLowerCase()));
}

const activityCategoryAliases: Record<string, string[]> = {
  culture: ['文化', '文艺', '讲座', '演出', '书画', '音乐', '舞蹈'],
  sports: ['体育', '健身', '运动', '八段锦', '太极'],
  health: ['健康', '养生', '康复', '保健'],
  social: ['社交', '社团', '公益', '交流'],
};

const courseCategoryAliases: Record<string, string[]> = {
  calligraphy: ['书法', '书画'],
  painting: ['绘画', '美术', '素描', '书画'],
  music: ['音乐', '声乐', '器乐', '钢琴'],
  dance: ['舞蹈', '形体'],
  digital: ['数字', '手机', '智能', '电脑'],
  health: ['健康', '养生', '康复', '保健'],
  handicraft: ['手工', '手作', '编织'],
};

const clubCategoryAliases: Record<string, string[]> = {
  tai_chi: ['太极'],
  dance: ['舞蹈', '形体'],
  chess: ['棋', '象棋', '围棋'],
  singing: ['合唱', '声乐', '歌唱'],
  photography: ['摄影'],
  gardening: ['园艺', '花卉'],
  reading: ['读书', '阅读'],
};

const stationServiceAliases: Record<string, string[]> = {
  daily_care: ['日间照料'],
  medical: ['医疗', '医养', '健康'],
  rehabilitation: ['康复'],
  housekeeping: ['家政', '便民服务'],
  emergency: ['紧急', '呼叫'],
  meal_delivery: ['送餐', '助餐', '膳食助餐'],
};

const serviceTypes: Array<{ service: ServiceType; aliases: string[] }> = [
  { service: 'daily_care', aliases: ['日间照料'] },
  { service: 'medical', aliases: ['医疗', '医养', '健康'] },
  { service: 'rehabilitation', aliases: ['康复'] },
  { service: 'mental_health', aliases: ['心理'] },
  { service: 'housekeeping', aliases: ['家政', '便民服务'] },
  { service: 'emergency', aliases: ['紧急', '呼叫'] },
  { service: 'meal_delivery', aliases: ['送餐', '助餐', '膳食助餐'] },
  { service: 'bathing_assist', aliases: ['助浴'] },
];

const districtKeywords = ['梁溪区', '锡山区', '滨湖区', '新吴区', '惠山区', '经开区'];
const streetKeywords = ['街道', '镇'];
const communityKeywords = ['社区'];
