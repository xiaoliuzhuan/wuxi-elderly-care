import { ElderlyService } from '../service/ElderlyService';
import { MockCmsAdapter } from '../adapter/MockCmsAdapter';
import { MCP_TOOLS, handleToolCall } from '../mcp/index';

describe('MCP tools', () => {
  const service = new ElderlyService(new MockCmsAdapter(), null);

  it('should expose 5 tool definitions', () => {
    expect(MCP_TOOLS).toHaveLength(5);
    expect(MCP_TOOLS.map((tool) => tool.name)).toEqual([
      'get_elderly_activities',
      'get_elderly_courses',
      'get_elderly_clubs',
      'get_meal_points',
      'get_home_care_stations',
    ]);
  });

  it('should handle activities tool call', async () => {
    const result = await handleToolCall(service, 'get_elderly_activities', {
      date: '2026-04-12',
      category: 'social',
    });

    expect(result).not.toHaveProperty('isError', true);
    expect(result.content[0].text).toContain('2026年4月12日');
    expect(result.content[0].text).toContain('活动列表');
  });

  it('should handle meal points tool call', async () => {
    const result = await handleToolCall(service, 'get_meal_points', {
      district: '梁溪区',
    });

    expect(result).not.toHaveProperty('isError', true);
    expect(result.content[0].text).toContain('梁溪区当前共查到');
    expect(result.content[0].text).toContain('助餐点列表');
  });

  it('should render fallback wording in a natural sentence', async () => {
    const fallbackService = {
      getActivities: async () => ({
        date: '2026-04-14',
        totalCount: 5,
        activities: [
          {
            activityId: 'ACT_001',
            name: '暖心义诊护安康—中医义诊活动',
            category: 'health',
            description: '示例活动',
            startTime: '2026-04-14 08:30:00',
            endTime: '2026-04-14 09:30:00',
            location: '社区蘑菇亭',
            community: '高浪社区',
            organizer: '高浪社区',
            status: 'UPCOMING',
            lastUpdatedAt: '2026-04-13T10:00:00+08:00',
          },
        ],
        meta: {
          requestedFilters: { date: '2026-04-14', community: '尚泽社区' },
          appliedFilters: { date: '2026-04-14' },
          exactMatchCount: 0,
          fallbackApplied: true,
          droppedFilters: ['community'],
          fallbackStrategy: 'drop_community_keep_date',
          note: '指定社区暂无活动，已回退到同日期的可查活动。',
        },
      }),
      getCourses: async () => ({ courses: [], totalCount: 0 }),
      getClubs: async () => ({ clubs: [], totalCount: 0 }),
      getMealPoints: async () => ({ points: [], totalCount: 0 }),
      getHomeCareStations: async () => ({ stations: [], totalCount: 0 }),
    } as unknown as ElderlyService;

    const result = await handleToolCall(fallbackService, 'get_elderly_activities', {
      date: '2026-04-14',
      community: '尚泽社区',
    });

    expect(result).not.toHaveProperty('isError', true);
    expect(result.content[0].text).toContain('2026年4月14日，尚泽社区当前没有查到活动记录；不过当天其他社区还有 5 场活动可参考，我先列出来。');
    expect(result.content[0].text).toContain('原始条件为日期=2026-04-14，社区=尚泽社区；实际命中条件为日期=2026-04-14。');
  });

  it('should return an error for unknown tools', async () => {
    const result = await handleToolCall(service, 'unknown_tool', {});

    expect('isError' in result && result.isError).toBe(true);
    expect(result.content[0].text).toContain('未知工具');
  });
});
