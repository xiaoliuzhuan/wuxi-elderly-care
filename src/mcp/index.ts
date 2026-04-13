#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ElderlyService } from '../service/ElderlyService';

export const MCP_TOOLS = [
  {
    name: 'get_elderly_activities',
    description: '查询社区文娱活动，支持 date、community、category 筛选。',
    inputSchema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: '查询日期，格式 YYYY-MM-DD' },
        community: { type: 'string', description: '社区名称筛选' },
        category: { type: 'string', description: '活动类别筛选，可传单值或逗号分隔' },
      },
    },
  },
  {
    name: 'get_elderly_courses',
    description: '查询老年兴趣课程，支持 community、category 筛选。',
    inputSchema: {
      type: 'object' as const,
      properties: {
        community: { type: 'string', description: '社区或区域关键字' },
        category: { type: 'string', description: '课程类别筛选，可传单值或逗号分隔' },
      },
    },
  },
  {
    name: 'get_elderly_clubs',
    description: '查询兴趣社团，支持 community、category 筛选。',
    inputSchema: {
      type: 'object' as const,
      properties: {
        community: { type: 'string', description: '社区名称筛选' },
        category: { type: 'string', description: '社团类别筛选，可传单值或逗号分隔' },
      },
    },
  },
  {
    name: 'get_meal_points',
    description: '查询惠老助餐点，支持 district、street 筛选。',
    inputSchema: {
      type: 'object' as const,
      properties: {
        district: { type: 'string', description: '区县筛选，如 梁溪区' },
        street: { type: 'string', description: '街道筛选，如 清名桥街道' },
      },
    },
  },
  {
    name: 'get_home_care_stations',
    description: '查询居家养老服务站，支持 district、street、service 筛选。',
    inputSchema: {
      type: 'object' as const,
      properties: {
        district: { type: 'string', description: '区县筛选' },
        street: { type: 'string', description: '街道筛选' },
        service: { type: 'string', description: '服务类型筛选，可传单值' },
      },
    },
  },
] as const;

export function createMcpServer(service: ElderlyService = new ElderlyService()): Server {
  const server = new Server(
    { name: 'skill-elderly-care-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [...MCP_TOOLS],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) =>
    handleToolCall(service, request.params.name, request.params.arguments)
  );

  return server;
}

async function main() {
  const service = new ElderlyService();
  const server = createMcpServer(service);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('skill-elderly-care MCP server started (stdio)');
}

export async function handleToolCall(
  service: ElderlyService,
  name: string,
  args: Record<string, unknown> | undefined
) {
  try {
    switch (name) {
      case 'get_elderly_activities': {
        const data = await service.getActivities(
          asOptionalString(args?.date),
          asOptionalString(args?.community),
          splitCsv(args?.category)
        );
        return toTextResult(data);
      }

      case 'get_elderly_courses': {
        const data = await service.getCourses(
          asOptionalString(args?.community),
          splitCsv(args?.category)
        );
        return toTextResult(data);
      }

      case 'get_elderly_clubs': {
        const data = await service.getClubs(
          asOptionalString(args?.community),
          splitCsv(args?.category)
        );
        return toTextResult(data);
      }

      case 'get_meal_points': {
        const data = await service.getMealPoints(
          asOptionalString(args?.district),
          asOptionalString(args?.street)
        );
        return toTextResult(data);
      }

      case 'get_home_care_stations': {
        const data = await service.getHomeCareStations(
          asOptionalString(args?.district),
          asOptionalString(args?.street),
          asOptionalString(args?.service)
        );
        return toTextResult(data);
      }

      default:
        return toErrorResult(`未知工具: ${name}`);
    }
  } catch (error) {
    return toErrorResult(error instanceof Error ? error.message : '未知错误');
  }
}

function splitCsv(value: unknown): string[] | undefined {
  if (typeof value !== 'string') return undefined;
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function toTextResult(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

function toErrorResult(message: string) {
  return {
    content: [{ type: 'text' as const, text: `查询失败: ${message}` }],
    isError: true,
  };
}

if (require.main === module) {
  main().catch((error) => {
    console.error('skill-elderly-care MCP server failed to start:', error);
    process.exit(1);
  });
}
