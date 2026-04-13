import {
  CmsActivitiesResponse,
  CmsCoursesResponse,
  CmsClubsResponse,
  CmsMealPointsResponse,
  CmsHomeCareStationsResponse,
} from '../model/types';

/**
 * CMS 只读适配器接口 — 从代码设计层面杜绝写入
 */
export interface CmsReadOnlyAdapter {
  getActivities(date?: string, community?: string, category?: string[]): Promise<CmsActivitiesResponse>;
  getCourses(community?: string, category?: string[]): Promise<CmsCoursesResponse>;
  getClubs(community?: string, category?: string[]): Promise<CmsClubsResponse>;
  getMealPoints(district?: string, street?: string): Promise<CmsMealPointsResponse>;
  getHomeCareStations(district?: string, street?: string, service?: string): Promise<CmsHomeCareStationsResponse>;
}
