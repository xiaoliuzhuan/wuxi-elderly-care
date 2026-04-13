import { CmsReadOnlyAdapter } from './CmsReadOnlyAdapter';
import {
  CmsActivitiesResponse,
  CmsCoursesResponse,
  CmsClubsResponse,
  CmsMealPointsResponse,
  CmsHomeCareStationsResponse,
} from '../model/types';

const mockActivities: CmsActivitiesResponse = {
  activities: [
    {
      activityId: 'ACT_001', name: '重阳节社区联欢', category: 'social',
      description: '社区老年朋友欢聚一堂，文艺表演、茶话会', startTime: '2026-04-12T09:00:00+08:00',
      endTime: '2026-04-12T11:30:00+08:00', location: '清名桥社区活动中心',
      community: '清名桥社区', organizer: '清名桥社区居委会', targetAge: '60+',
      maxParticipants: 80, currentParticipants: 52, status: 'UPCOMING',
      contactPhone: '0510-8288****', lastUpdatedAt: '2026-04-10T09:00:00+08:00',
    },
    {
      activityId: 'ACT_002', name: '八段锦健身操教学', category: 'health',
      description: '专业教练指导八段锦，适合零基础老年朋友', startTime: '2026-04-11T07:30:00+08:00',
      endTime: '2026-04-11T08:30:00+08:00', location: '南禅寺街道文体中心',
      community: '南禅寺社区', organizer: '南禅寺街道办', targetAge: '55+',
      status: 'UPCOMING', lastUpdatedAt: '2026-04-10T09:00:00+08:00',
    },
    {
      activityId: 'ACT_003', name: '智能手机使用培训', category: 'culture',
      description: '教老年朋友使用微信、视频通话、移动支付等常用功能', startTime: '2026-04-13T14:00:00+08:00',
      endTime: '2026-04-13T16:00:00+08:00', location: '广益街道社区服务中心',
      community: '广益社区', organizer: '广益街道志愿者服务队', targetAge: '55+',
      maxParticipants: 30, currentParticipants: 30, status: 'FULL',
      contactPhone: '0510-8566****', lastUpdatedAt: '2026-04-10T09:00:00+08:00',
    },
  ],
};

const mockCourses: CmsCoursesResponse = {
  courses: [
    {
      courseId: 'CRS_001', name: '书法入门班', category: 'calligraphy',
      description: '从基本笔画开始，学习楷书入门', instructor: '张老师',
      schedule: '每周二 14:00-15:30', location: '梁溪区老年大学',
      community: '崇安寺社区', semester: '2026年春季', totalSessions: 16,
      remainingSlots: 5, fee: '免费', targetAge: '55+',
      status: 'ENROLLING', lastUpdatedAt: '2026-04-10T09:00:00+08:00',
    },
    {
      courseId: 'CRS_002', name: '合唱团声乐课', category: 'music',
      description: '学习基本发声技巧和经典歌曲', instructor: '王老师',
      schedule: '每周四 09:30-11:00', location: '南长区文化活动中心',
      community: '南禅寺社区', semester: '2026年春季', totalSessions: 16,
      remainingSlots: 0, fee: '30元/学期',
      status: 'FULL', lastUpdatedAt: '2026-04-10T09:00:00+08:00',
    },
    {
      courseId: 'CRS_003', name: '智能手机与短视频', category: 'digital',
      description: '学习手机拍照、剪辑短视频、发布朋友圈', instructor: '李老师',
      schedule: '每周五 14:00-15:30', location: '锡山区老年活动中心',
      community: '东亭社区', semester: '2026年春季', totalSessions: 12,
      remainingSlots: 8, fee: '免费', targetAge: '50+',
      status: 'ENROLLING', lastUpdatedAt: '2026-04-10T09:00:00+08:00',
    },
  ],
};

const mockClubs: CmsClubsResponse = {
  clubs: [
    {
      clubId: 'CLB_001', name: '夕阳红太极队', category: 'tai_chi',
      description: '每日晨练太极拳，强身健体', meetingSchedule: '每天 06:30-07:30',
      meetingLocation: '运河公园', community: '清名桥社区', memberCount: 35,
      leader: '陈*明', isRecruiting: true, fee: '免费',
      lastUpdatedAt: '2026-04-10T09:00:00+08:00',
    },
    {
      clubId: 'CLB_002', name: '金秋合唱团', category: 'singing',
      description: '喜欢唱歌的老年朋友聚在一起，排练经典歌曲', meetingSchedule: '每周三、六 09:00-11:00',
      meetingLocation: '梁溪区文化馆', community: '崇安寺社区', memberCount: 48,
      leader: '王*芳', isRecruiting: true, fee: '20元/月',
      lastUpdatedAt: '2026-04-10T09:00:00+08:00',
    },
    {
      clubId: 'CLB_003', name: '棋友汇', category: 'chess',
      description: '象棋、围棋爱好者切磋交流', meetingSchedule: '每周二、四、六 14:00-17:00',
      meetingLocation: '南禅寺社区棋牌室', community: '南禅寺社区', memberCount: 22,
      leader: '李*强', isRecruiting: true, fee: '免费',
      lastUpdatedAt: '2026-04-10T09:00:00+08:00',
    },
  ],
};

const mockMealPoints: CmsMealPointsResponse = {
  points: [
    {
      pointId: 'MP_001', name: '清名桥惠老助餐点', address: '无锡市梁溪区清名路88号',
      district: '梁溪区', street: '清名桥街道', community: '清名桥社区',
      phone: '0510-8288****', businessHours: '周一至周五 10:30-13:00, 16:30-18:30',
      mealTypes: ['午餐', '晚餐'], priceRange: '8-15元/餐',
      subsidyInfo: '80岁以上享5元/餐补贴，低保户享全额补贴',
      capacity: 60, features: ['无障碍', '配送上门'], status: 'OPEN',
      lastUpdatedAt: '2026-04-10T09:00:00+08:00',
    },
    {
      pointId: 'MP_002', name: '南禅寺社区长者食堂', address: '无锡市梁溪区南禅寺街道向阳路56号',
      district: '梁溪区', street: '南禅寺街道', community: '南禅寺社区',
      phone: '0510-8566****', businessHours: '周一至周六 10:30-13:00',
      mealTypes: ['午餐'], priceRange: '6-12元/餐',
      subsidyInfo: '70岁以上享3元/餐补贴', capacity: 40,
      features: ['清真可选', '无障碍'], status: 'OPEN',
      lastUpdatedAt: '2026-04-10T09:00:00+08:00',
    },
    {
      pointId: 'MP_003', name: '广益街道银龄餐厅', address: '无锡市梁溪区广益路128号',
      district: '梁溪区', street: '广益街道', community: '广益社区',
      phone: '0510-8577****', businessHours: '周一至周五 11:00-12:30',
      mealTypes: ['午餐'], priceRange: '8-10元/餐', capacity: 30,
      status: 'OPEN', lastUpdatedAt: '2026-04-10T09:00:00+08:00',
    },
  ],
};

const mockStations: CmsHomeCareStationsResponse = {
  stations: [
    {
      stationId: 'STA_001', name: '清名桥居家养老服务站', address: '无锡市梁溪区清名路100号',
      district: '梁溪区', street: '清名桥街道', community: '清名桥社区',
      phone: '0510-8288****', serviceHotline: '96158',
      businessHours: '周一至周六 08:30-17:00',
      services: ['daily_care', 'meal_delivery', 'housekeeping', 'emergency'],
      serviceDescription: '提供日间照料、送餐上门、家政服务、紧急呼叫等居家养老服务',
      coverageArea: '清名桥街道辖区', operator: '无锡市颐和养老服务中心',
      rating: 4.5, features: ['日间照料', '上门服务', '紧急呼叫', '助浴服务'],
      status: 'OPEN', lastUpdatedAt: '2026-04-10T09:00:00+08:00',
    },
    {
      stationId: 'STA_002', name: '南禅寺居家养老服务中心', address: '无锡市梁溪区南禅寺街道学前路22号',
      district: '梁溪区', street: '南禅寺街道', community: '南禅寺社区',
      phone: '0510-8566****', businessHours: '周一至周五 08:00-17:30',
      services: ['daily_care', 'medical', 'rehabilitation', 'mental_health'],
      serviceDescription: '提供日间照料、健康管理、康复训练、心理关爱等综合服务',
      coverageArea: '南禅寺街道辖区', operator: '无锡市银龄关爱服务社',
      rating: 4.8, features: ['日间照料', '健康管理', '康复训练', '心理咨询'],
      status: 'OPEN', lastUpdatedAt: '2026-04-10T09:00:00+08:00',
    },
  ],
};

export class MockCmsAdapter implements CmsReadOnlyAdapter {
  async getActivities(_date?: string, _community?: string, _category?: string[]): Promise<CmsActivitiesResponse> {
    return mockActivities;
  }
  async getCourses(_community?: string, _category?: string[]): Promise<CmsCoursesResponse> {
    return mockCourses;
  }
  async getClubs(_community?: string, _category?: string[]): Promise<CmsClubsResponse> {
    return mockClubs;
  }
  async getMealPoints(_district?: string, _street?: string): Promise<CmsMealPointsResponse> {
    return mockMealPoints;
  }
  async getHomeCareStations(_district?: string, _street?: string, _service?: string): Promise<CmsHomeCareStationsResponse> {
    return mockStations;
  }
}
