#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ElderlyService } from '../service/ElderlyService';
import {
  ActivitiesResponse,
  ClubsResponse,
  CoursesResponse,
  HomeCareStationsResponse,
  MealPointsResponse,
  QueryFilterValue,
  QueryResolutionMeta,
} from '../model/types';

const PREVIEW_LIMIT = 10;

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

type ToolName = typeof MCP_TOOLS[number]['name'];

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
        return toTextResult(name, data);
      }

      case 'get_elderly_courses': {
        const data = await service.getCourses(
          asOptionalString(args?.community),
          splitCsv(args?.category)
        );
        return toTextResult(name, data);
      }

      case 'get_elderly_clubs': {
        const data = await service.getClubs(
          asOptionalString(args?.community),
          splitCsv(args?.category)
        );
        return toTextResult(name, data);
      }

      case 'get_meal_points': {
        const data = await service.getMealPoints(
          asOptionalString(args?.district),
          asOptionalString(args?.street)
        );
        return toTextResult(name, data);
      }

      case 'get_home_care_stations': {
        const data = await service.getHomeCareStations(
          asOptionalString(args?.district),
          asOptionalString(args?.street),
          asOptionalString(args?.service)
        );
        return toTextResult(name, data);
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

function toTextResult(name: string, data: unknown) {
  return {
    content: [{ type: 'text' as const, text: formatToolResult(name as ToolName, data) }],
  };
}

function formatToolResult(name: ToolName, data: unknown): string {
  switch (name) {
    case 'get_elderly_activities':
      return formatActivitiesResult(data as ActivitiesResponse);
    case 'get_elderly_courses':
      return formatCoursesResult(data as CoursesResponse);
    case 'get_elderly_clubs':
      return formatClubsResult(data as ClubsResponse);
    case 'get_meal_points':
      return formatMealPointsResult(data as MealPointsResponse);
    case 'get_home_care_stations':
      return formatHomeCareStationsResult(data as HomeCareStationsResponse);
  }
}

function formatActivitiesResult(data: ActivitiesResponse): string {
  const meta = data.meta;
  const community = getFilterText(meta?.requestedFilters.community);
  const category = getFilterText(meta?.requestedFilters.category);
  const date = getFilterText(meta?.requestedFilters.date) ?? data.date;
  const lines: string[] = [buildActivitiesHeadline(data, meta, date, community, category)];

  appendMetaExplanation(lines, meta, {
    date: '日期',
    community: '社区',
    category: '活动分类',
  });

  appendPreview(
    lines,
    '活动列表',
    data.activities,
    (item, index) => `${index + 1}. ${item.name}｜${item.community}｜${item.startTime}｜${item.location}`
  );

  return lines.join('\n');
}

function formatCoursesResult(data: CoursesResponse): string {
  const meta = data.meta;
  const community = getFilterText(meta?.requestedFilters.community);
  const category = getFilterText(meta?.requestedFilters.category);
  const lines: string[] = [buildCoursesHeadline(data, meta, community, category)];

  appendMetaExplanation(lines, meta, {
    community: '社区/区域',
    category: '课程分类',
  });

  appendPreview(
    lines,
    '课程列表',
    data.courses,
    (item, index) =>
      `${index + 1}. ${item.name}｜${formatCourseCategory(item.category)}｜${item.schedule}｜${item.location}｜费用：${item.fee}`
  );

  return lines.join('\n');
}

function formatClubsResult(data: ClubsResponse): string {
  const meta = data.meta;
  const community = getFilterText(meta?.requestedFilters.community);
  const category = getFilterText(meta?.requestedFilters.category);
  const lines: string[] = [buildClubsHeadline(data, meta, community, category)];

  appendMetaExplanation(lines, meta, {
    community: '社区',
    category: '社团分类',
  });

  appendPreview(
    lines,
    '社团列表',
    data.clubs,
    (item, index) =>
      `${index + 1}. ${item.name}｜${item.community}｜${item.meetingSchedule}｜负责人：${item.leader}｜${item.isRecruiting ? '招募中' : '暂不招募'}`
  );

  return lines.join('\n');
}

function formatMealPointsResult(data: MealPointsResponse): string {
  const meta = data.meta;
  const district = getFilterText(meta?.requestedFilters.district);
  const street = getFilterText(meta?.requestedFilters.street);
  const lines: string[] = [buildMealPointsHeadline(data, meta, district, street)];

  appendMetaExplanation(lines, meta, {
    district: '区县',
    street: '街道',
  });

  if (shouldCondenseMealPointPreview(meta, data.totalCount)) {
    lines.push('结果较多，建议告诉我区县、街道或社区，我可以继续精确筛选。');
    return lines.join('\n');
  }

  appendPreview(
    lines,
    '助餐点列表',
    data.points,
    (item, index) =>
      `${index + 1}. ${item.name}｜${item.address}｜电话：${item.phone}｜营业时间：${item.businessHours}`
  );

  return lines.join('\n');
}

function formatHomeCareStationsResult(data: HomeCareStationsResponse): string {
  const meta = data.meta;
  const district = getFilterText(meta?.requestedFilters.district);
  const street = getFilterText(meta?.requestedFilters.street);
  const service = getFilterText(meta?.requestedFilters.service);
  const lines: string[] = [buildHomeCareStationsHeadline(data, meta, district, street, service)];

  appendMetaExplanation(lines, meta, {
    district: '区县',
    street: '街道',
    service: '服务类型',
  });

  appendPreview(
    lines,
    '服务站列表',
    data.stations,
    (item, index) =>
      `${index + 1}. ${item.name}｜${item.address}｜营业时间：${item.businessHours}｜服务：${formatStationServices(item.services, item.features)}｜电话：${item.phone}`
  );

  return lines.join('\n');
}

function buildActivitiesHeadline(
  data: ActivitiesResponse,
  meta: QueryResolutionMeta | undefined,
  date: string | undefined,
  community: string | undefined,
  category: string | undefined
): string {
  if (data.totalCount === 0) {
    return buildNoResultHeadline('活动', meta, { date, community, category });
  }

  if (meta?.fallbackApplied && meta.exactMatchCount === 0) {
    if (community && date && !hasAppliedFilter(meta, 'community') && hasAppliedFilter(meta, 'date')) {
      return `${formatChineseDate(date)}，${community}当前没有查到活动记录；不过当天其他社区还有 ${data.totalCount} 场活动可参考，我先列出来。`;
    }
    if (category && !hasAppliedFilter(meta, 'category')) {
      return `当前没有查到符合「${category}」分类的活动；不过还有 ${data.totalCount} 场其他活动可参考，我先列出来。`;
    }
    return `按原始条件没有查到活动；不过放宽条件后还有 ${data.totalCount} 场活动可参考，我先列出来。`;
  }

  if (community && date) {
    return `${formatChineseDate(date)}，${community}共查到 ${data.totalCount} 场活动。`;
  }
  if (date) {
    return `${formatChineseDate(date)}共查到 ${data.totalCount} 场活动。`;
  }
  return `当前共查到 ${data.totalCount} 场活动。`;
}

function buildCoursesHeadline(
  data: CoursesResponse,
  meta: QueryResolutionMeta | undefined,
  community: string | undefined,
  category: string | undefined
): string {
  if (data.totalCount === 0) {
    return buildNoResultHeadline('课程', meta, { community, category });
  }

  if (meta?.fallbackApplied && meta.exactMatchCount === 0) {
    if (community && !hasAppliedFilter(meta, 'community')) {
      return `${community}当前没有查到相关课程；不过全市还有 ${data.totalCount} 门课程可参考，我先列出来。`;
    }
    if (category && !hasAppliedFilter(meta, 'category')) {
      return `当前没有查到符合「${category}」分类的课程；不过目前还有 ${data.totalCount} 门课程可参考，我先列出来。`;
    }
    return `按原始条件没有查到课程；不过放宽条件后还有 ${data.totalCount} 门课程可参考，我先列出来。`;
  }

  if (community && category) {
    return `${community}当前共查到 ${data.totalCount} 门符合「${category}」分类的课程。`;
  }
  if (community) {
    return `${community}当前共查到 ${data.totalCount} 门课程。`;
  }
  if (category) {
    return `当前共查到 ${data.totalCount} 门符合「${category}」分类的课程。`;
  }
  return `当前共查到 ${data.totalCount} 门课程。`;
}

function buildClubsHeadline(
  data: ClubsResponse,
  meta: QueryResolutionMeta | undefined,
  community: string | undefined,
  category: string | undefined
): string {
  if (data.totalCount === 0) {
    return buildNoResultHeadline('社团', meta, { community, category });
  }

  if (meta?.fallbackApplied && meta.exactMatchCount === 0) {
    if (community && !hasAppliedFilter(meta, 'community')) {
      return `${community}当前没有查到相关社团；不过全市还有 ${data.totalCount} 个社团可参考，我先列出来。`;
    }
    if (category && !hasAppliedFilter(meta, 'category')) {
      return `当前没有查到符合「${category}」分类的社团；不过还有 ${data.totalCount} 个其他社团可参考，我先列出来。`;
    }
    return `按原始条件没有查到社团；不过放宽条件后还有 ${data.totalCount} 个社团可参考，我先列出来。`;
  }

  if (community && category) {
    return `${community}当前共查到 ${data.totalCount} 个符合「${category}」分类的社团。`;
  }
  if (community) {
    return `${community}当前共查到 ${data.totalCount} 个社团。`;
  }
  if (category) {
    return `当前共查到 ${data.totalCount} 个符合「${category}」分类的社团。`;
  }
  return `当前共查到 ${data.totalCount} 个社团。`;
}

function buildMealPointsHeadline(
  data: MealPointsResponse,
  meta: QueryResolutionMeta | undefined,
  district: string | undefined,
  street: string | undefined
): string {
  if (data.totalCount === 0) {
    return buildNoResultHeadline('助餐点', meta, { district, street });
  }

  if (meta?.fallbackApplied && meta.exactMatchCount === 0) {
    if (district && street && !hasAppliedFilter(meta, 'district') && hasAppliedFilter(meta, 'street')) {
      return `按“${district} + ${street}”没有同时命中助餐点；不过按${street}仍查到 ${data.totalCount} 个助餐点，我先列出来。`;
    }
    if (district && street && hasAppliedFilter(meta, 'district') && !hasAppliedFilter(meta, 'street')) {
      return `按“${district} + ${street}”没有同时命中助餐点；不过按${district}仍查到 ${data.totalCount} 个助餐点，我先列出来。`;
    }
    return `按原始条件没有查到助餐点；不过放宽条件后还有 ${data.totalCount} 个助餐点可参考，我先列出来。`;
  }

  if (district && street) {
    return `${district}${street}当前共查到 ${data.totalCount} 个助餐点。`;
  }
  if (district) {
    return `${district}当前共查到 ${data.totalCount} 个助餐点。`;
  }
  if (street) {
    return `${street}当前共查到 ${data.totalCount} 个助餐点。`;
  }
  return `当前共查到 ${data.totalCount} 个助餐点。`;
}

function buildHomeCareStationsHeadline(
  data: HomeCareStationsResponse,
  meta: QueryResolutionMeta | undefined,
  district: string | undefined,
  street: string | undefined,
  service: string | undefined
): string {
  if (data.totalCount === 0) {
    return buildNoResultHeadline('居家养老服务站', meta, { district, street, service });
  }

  if (meta?.fallbackApplied && meta.exactMatchCount === 0) {
    if (service && !hasAppliedFilter(meta, 'service')) {
      return `当前没有查到符合「${service}」服务的服务站；不过同区域还有 ${data.totalCount} 家服务站可参考，我先列出来。`;
    }
    if (district && street && !hasAppliedFilter(meta, 'district') && hasAppliedFilter(meta, 'street')) {
      return `按“${district} + ${street}”没有同时命中服务站；不过按${street}仍查到 ${data.totalCount} 家服务站，我先列出来。`;
    }
    if (district && street && hasAppliedFilter(meta, 'district') && !hasAppliedFilter(meta, 'street')) {
      return `按“${district} + ${street}”没有同时命中服务站；不过按${district}仍查到 ${data.totalCount} 家服务站，我先列出来。`;
    }
    return `按原始条件没有查到服务站；不过放宽条件后还有 ${data.totalCount} 家服务站可参考，我先列出来。`;
  }

  if (district && street) {
    return `${district}${street}当前共查到 ${data.totalCount} 家居家养老服务站。`;
  }
  if (district) {
    return `${district}当前共查到 ${data.totalCount} 家居家养老服务站。`;
  }
  if (street) {
    return `${street}当前共查到 ${data.totalCount} 家居家养老服务站。`;
  }
  return `当前共查到 ${data.totalCount} 家居家养老服务站。`;
}

function buildNoResultHeadline(
  entityName: string,
  meta: QueryResolutionMeta | undefined,
  requested: Record<string, string | undefined>
): string {
  const requestedText = Object.values(requested).filter(Boolean).join('，');
  if (meta?.fallbackApplied) {
    return `${requestedText ? `${requestedText}当前` : '当前'}没有查到${entityName}，放宽条件后也没有找到可参考结果。`;
  }
  return `${requestedText ? `${requestedText}当前` : '当前'}没有查到${entityName}。`;
}

function appendMetaExplanation(
  lines: string[],
  meta: QueryResolutionMeta | undefined,
  labelMap: Record<string, string>
): void {
  if (!meta) return;

  const requestedText = formatFilters(meta.requestedFilters, labelMap);
  const appliedText = formatFilters(meta.appliedFilters, labelMap);

  if (meta.fallbackApplied) {
    const parts = ['查询说明：'];
    if (meta.note) {
      parts.push(meta.note);
    }
    parts.push(`原始条件为${requestedText || '未限定'}；实际命中条件为${appliedText || '未限定'}。`);
    lines.push(parts.join(' '));
  } else if (requestedText) {
    lines.push(`查询条件：${requestedText}。`);
  }
}

function appendPreview<T>(
  lines: string[],
  title: string,
  items: T[],
  formatItem: (item: T, index: number) => string
): void {
  if (items.length === 0) {
    return;
  }

  lines.push('', `${title}：`);
  const preview = items.slice(0, PREVIEW_LIMIT);
  for (const [index, item] of preview.entries()) {
    lines.push(formatItem(item, index));
  }

  if (items.length > PREVIEW_LIMIT) {
    lines.push(`已先展示前 ${PREVIEW_LIMIT} 条，其余 ${items.length - PREVIEW_LIMIT} 条可按需继续展开。`);
  }
}

function shouldCondenseMealPointPreview(
  meta: QueryResolutionMeta | undefined,
  totalCount: number
): boolean {
  if (!meta) return false;

  return (
    totalCount > PREVIEW_LIMIT &&
    Object.keys(meta.requestedFilters).length === 0 &&
    !meta.fallbackApplied
  );
}

function formatFilters(
  filters: Record<string, QueryFilterValue>,
  labelMap: Record<string, string>
): string {
  const parts = Object.entries(filters).map(([key, value]) => {
    const label = labelMap[key] ?? key;
    return `${label}=${formatFilterValue(value)}`;
  });

  return parts.join('，');
}

function formatFilterValue(value: QueryFilterValue): string {
  if (Array.isArray(value)) {
    return value.join('、');
  }
  return value;
}

function getFilterText(value: QueryFilterValue | undefined): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value.join('、');
  }
  return value;
}

function hasAppliedFilter(meta: QueryResolutionMeta, key: string): boolean {
  return key in meta.appliedFilters;
}

function formatChineseDate(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;

  const [, year, month, day] = match;
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function formatCourseCategory(value: CoursesResponse['courses'][number]['category']): string {
  const labels: Record<CoursesResponse['courses'][number]['category'], string> = {
    calligraphy: '书法',
    painting: '绘画',
    music: '音乐',
    dance: '舞蹈',
    digital: '数字技能',
    health: '健康养生',
    handicraft: '手工',
    language: '语言',
    other: '其他',
  };

  return labels[value] ?? value;
}

function formatStationServices(services: string[], features?: string[]): string {
  if (features && features.length > 0) {
    return features.join('、');
  }
  return services.join('、');
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
