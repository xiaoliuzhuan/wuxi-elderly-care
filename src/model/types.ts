// ============================================================
// 居家养老服务 Skill — DTO 类型定义
// ============================================================

// ---- 通用 ----

export interface ApiResponse<T> {
  code: string;
  message: string;
  traceId: string;
  data?: T;
  retryable?: boolean;
  suggestion?: string;
}

export type QueryFilterValue = string | string[];

export interface QueryResolutionMeta {
  requestedFilters: Record<string, QueryFilterValue>;
  appliedFilters: Record<string, QueryFilterValue>;
  exactMatchCount: number;
  fallbackApplied: boolean;
  droppedFilters?: string[];
  fallbackStrategy?: string;
  note?: string;
}

// ---- 1. 文娱活动 ----

export type ActivityCategory = 'culture' | 'sports' | 'health' | 'social' | 'other';
export type ActivityStatus = 'UPCOMING' | 'ONGOING' | 'FULL' | 'CANCELLED';

export interface ElderlyActivity {
  activityId: string;
  name: string;
  category: ActivityCategory;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  community: string;
  organizer: string;
  targetAge?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  status: ActivityStatus;
  registrationDeadline?: string;
  contactPhone?: string;
  lastUpdatedAt: string;
}

export interface ActivitiesResponse {
  date: string;
  activities: ElderlyActivity[];
  totalCount: number;
  meta?: QueryResolutionMeta;
}

// ---- 2. 兴趣课程 ----

export type CourseCategory = 'calligraphy' | 'painting' | 'music' | 'dance' | 'digital' | 'health' | 'handicraft' | 'language' | 'other';

export interface ElderlyCourse {
  courseId: string;
  name: string;
  category: CourseCategory;
  description: string;
  instructor: string;
  schedule: string;
  location: string;
  community: string;
  semester: string;
  totalSessions: number;
  remainingSlots: number;
  fee: string;
  targetAge?: string;
  contactPhone?: string;
  status: 'ENROLLING' | 'FULL' | 'ONGOING' | 'COMPLETED';
  lastUpdatedAt: string;
}

export interface CoursesResponse {
  courses: ElderlyCourse[];
  totalCount: number;
  meta?: QueryResolutionMeta;
}

// ---- 3. 兴趣社团 ----

export type ClubCategory = 'tai_chi' | 'dance' | 'chess' | 'singing' | 'photography' | 'gardening' | 'reading' | 'calligraphy' | 'sports' | 'other';

export interface ElderlyClub {
  clubId: string;
  name: string;
  category: ClubCategory;
  description: string;
  meetingSchedule: string;
  meetingLocation: string;
  community: string;
  memberCount: number;
  leader: string;
  contactPhone?: string;
  isRecruiting: boolean;
  fee: string;
  lastUpdatedAt: string;
}

export interface ClubsResponse {
  clubs: ElderlyClub[];
  totalCount: number;
  meta?: QueryResolutionMeta;
}

// ---- 4. 惠老助餐点 ----

export interface MealServicePoint {
  pointId: string;
  name: string;
  address: string;
  district: string;
  street: string;
  community: string;
  phone: string;
  businessHours: string;
  mealTypes: string[];
  priceRange: string;
  subsidyInfo?: string;
  capacity?: number;
  features?: string[];
  status: 'OPEN' | 'CLOSED' | 'TEMPORARILY_CLOSED';
  lastUpdatedAt: string;
}

export interface MealPointsResponse {
  points: MealServicePoint[];
  totalCount: number;
  meta?: QueryResolutionMeta;
}

// ---- 5. 居家养老服务站 ----

export type ServiceType = 'daily_care' | 'medical' | 'rehabilitation' | 'mental_health' | 'housekeeping' | 'emergency' | 'meal_delivery' | 'bathing_assist';

export interface HomeCareStation {
  stationId: string;
  name: string;
  address: string;
  district: string;
  street: string;
  community: string;
  phone: string;
  serviceHotline?: string;
  businessHours: string;
  services: ServiceType[];
  serviceDescription: string;
  coverageArea: string;
  operator: string;
  rating?: number;
  features?: string[];
  status: 'OPEN' | 'CLOSED' | 'TEMPORARILY_CLOSED';
  lastUpdatedAt: string;
}

export interface HomeCareStationsResponse {
  stations: HomeCareStation[];
  totalCount: number;
  meta?: QueryResolutionMeta;
}

// ---- CMS 内部 API 响应 ----

export interface CmsActivitiesResponse {
  activities: ElderlyActivity[];
}

export interface CmsCoursesResponse {
  courses: ElderlyCourse[];
}

export interface CmsClubsResponse {
  clubs: ElderlyClub[];
}

export interface CmsMealPointsResponse {
  points: MealServicePoint[];
}

export interface CmsHomeCareStationsResponse {
  stations: HomeCareStation[];
}

// ---- 渠道配置 ----

export interface ChannelConfig {
  channelId: string;
  name: string;
  token: string;
  rateLimit: number;
  enabled: boolean;
}
