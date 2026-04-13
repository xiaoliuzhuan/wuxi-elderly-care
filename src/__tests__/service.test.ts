import { CmsReadOnlyAdapter } from '../adapter/CmsReadOnlyAdapter';
import {
  CmsActivitiesResponse,
  CmsClubsResponse,
  CmsCoursesResponse,
  CmsHomeCareStationsResponse,
  CmsMealPointsResponse,
} from '../model/types';
import { ElderlyService } from '../service/ElderlyService';

class ScenarioAdapter implements CmsReadOnlyAdapter {
  async getActivities(date?: string, community?: string, category?: string[]): Promise<CmsActivitiesResponse> {
    if (date === '2026-04-14' && community === '尚泽社区') {
      return { activities: [] };
    }

    if (date === '2026-04-14' && !community && !category?.length) {
      return {
        activities: [
          {
            activityId: 'ACT_FALLBACK',
            name: '春风传情，风铃寄意',
            category: 'social',
            description: 'fallback activity',
            startTime: '2026-04-14 09:00:00',
            endTime: '2026-04-14 10:00:00',
            location: '红旗社区居家养老服务站二楼活动室',
            community: '红旗社区',
            organizer: '红旗社区',
            status: 'UPCOMING',
            lastUpdatedAt: '2026-04-13T12:00:00+08:00',
          },
        ],
      };
    }

    return { activities: [] };
  }

  async getCourses(community?: string, category?: string[]): Promise<CmsCoursesResponse> {
    if (!community && category?.includes('dance')) {
      return { courses: [] };
    }

    if (!community && !category?.length) {
      return {
        courses: [
          {
            courseId: 'CRS_FALLBACK',
            name: '陶笛兴趣班【热门推荐】',
            category: 'music',
            description: 'fallback course',
            instructor: '王老师',
            schedule: '根据开班日期安排',
            location: '就近的居家养老服务站',
            community: '全市',
            semester: '当前开放',
            totalSessions: 8,
            remainingSlots: 9,
            fee: '99',
            status: 'ENROLLING',
            lastUpdatedAt: '2026-04-13T12:00:00+08:00',
          },
        ],
      };
    }

    return { courses: [] };
  }

  async getClubs(_community?: string, _category?: string[]): Promise<CmsClubsResponse> {
    return {
      clubs: [
        {
          clubId: 'CLB_001',
          name: '合唱社团',
          category: 'singing',
          description: 'fallback club',
          meetingSchedule: '周一上午9:00',
          meetingLocation: '江陂社区活动室',
          community: '江陂社区',
          memberCount: 32,
          leader: '王霖珍',
          isRecruiting: true,
          fee: '免费',
          lastUpdatedAt: '2026-04-13T12:00:00+08:00',
        },
      ],
    };
  }

  async getMealPoints(district?: string, street?: string): Promise<CmsMealPointsResponse> {
    if (district === '新吴区' && street === '旺庄街道') {
      return { points: [] };
    }

    if (!district && street === '旺庄街道') {
      return {
        points: [
          {
            pointId: 'MEAL_FALLBACK',
            name: '旺庄街道助餐中心',
            address: '春丰路2号(旺庄街道乐享颐养中心)',
            district: '待确认',
            street: '旺庄街道',
            community: '待确认',
            phone: '85290886',
            businessHours: '10:30-13:00',
            mealTypes: ['午餐'],
            priceRange: '待确认',
            status: 'OPEN',
            lastUpdatedAt: '2026-04-13T12:00:00+08:00',
          },
        ],
      };
    }

    if (district === '新吴区' && !street) {
      return {
        points: [
          {
            pointId: 'MEAL_DISTRICT',
            name: '新安街道第五社区助餐点',
            address: '新吴区新安街道新安花苑第五社区30号',
            district: '新吴区',
            street: '新安街道',
            community: '第五社区',
            phone: '15061793072',
            businessHours: '10:30-13:00',
            mealTypes: ['午餐'],
            priceRange: '待确认',
            status: 'OPEN',
            lastUpdatedAt: '2026-04-13T12:00:00+08:00',
          },
        ],
      };
    }

    return { points: [] };
  }

  async getHomeCareStations(_district?: string, _street?: string, _service?: string): Promise<CmsHomeCareStationsResponse> {
    return {
      stations: [
        {
          stationId: 'STA_001',
          name: '旺庄街道居家养老服务中心',
          address: '江苏省无锡市新吴区旺庄街道春潮花园(一区)363号对面',
          district: '新吴区',
          street: '旺庄街道',
          community: '春潮社区',
          phone: '待确认',
          businessHours: '08:00-16:30',
          services: ['daily_care', 'meal_delivery'],
          serviceDescription: '居家养老服务',
          coverageArea: '旺庄街道',
          operator: '知鹊平台',
          status: 'OPEN',
          lastUpdatedAt: '2026-04-13T12:00:00+08:00',
        },
      ],
    };
  }
}

describe('ElderlyService fallback', () => {
  const service = new ElderlyService(new ScenarioAdapter(), null);

  it('falls back to date-level activities when the requested community has no results', async () => {
    const result = await service.getActivities('2026-04-14', '尚泽社区');

    expect(result.totalCount).toBe(1);
    expect(result.activities[0].community).toBe('红旗社区');
    expect(result.meta).toEqual(
      expect.objectContaining({
        exactMatchCount: 0,
        fallbackApplied: true,
        appliedFilters: { date: '2026-04-14' },
        droppedFilters: ['community'],
        fallbackStrategy: 'drop_community_keep_date',
      })
    );
  });

  it('falls back to a broader course list when category filtering is too narrow', async () => {
    const result = await service.getCourses(undefined, ['dance']);

    expect(result.totalCount).toBe(1);
    expect(result.courses[0].name).toContain('陶笛');
    expect(result.meta).toEqual(
      expect.objectContaining({
        exactMatchCount: 0,
        fallbackApplied: true,
        appliedFilters: {},
        droppedFilters: ['category'],
        fallbackStrategy: 'drop_category',
      })
    );
  });

  it('falls back to street-level meal points when district + street misses due to text mismatch', async () => {
    const result = await service.getMealPoints('新吴区', '旺庄街道');

    expect(result.totalCount).toBe(1);
    expect(result.points[0].name).toBe('旺庄街道助餐中心');
    expect(result.meta).toEqual(
      expect.objectContaining({
        exactMatchCount: 0,
        fallbackApplied: true,
        appliedFilters: { street: '旺庄街道' },
        droppedFilters: ['district'],
        fallbackStrategy: 'street_only',
      })
    );
  });
});
