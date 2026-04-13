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
    expect(result.content[0].text).toContain('"activities"');
    expect(result.content[0].text).toContain('"totalCount"');
  });

  it('should handle meal points tool call', async () => {
    const result = await handleToolCall(service, 'get_meal_points', {
      district: '梁溪区',
    });

    expect(result).not.toHaveProperty('isError', true);
    expect(result.content[0].text).toContain('"points"');
  });

  it('should return an error for unknown tools', async () => {
    const result = await handleToolCall(service, 'unknown_tool', {});

    expect('isError' in result && result.isError).toBe(true);
    expect(result.content[0].text).toContain('未知工具');
  });
});
