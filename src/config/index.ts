import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { z } from 'zod';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const rootDir = path.resolve(__dirname, '../../');
const customEnvFile = process.env.ELDERLY_SKILL_ENV_FILE?.trim();

dotenvConfig({ path: path.resolve(rootDir, `.env.${nodeEnv}`), quiet: true });
dotenvConfig({ path: path.resolve(rootDir, '.env.skill'), override: true, quiet: true });
dotenvConfig({
  path: resolveEnvFilePath(customEnvFile, rootDir, '.env.local'),
  override: true,
  quiet: true,
});

const env = (key: string, fallback: string): string =>
  process.env[key] ?? fallback;

const envBool = (key: string, fallback: boolean): boolean => {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
};

const envInt = (key: string, fallback: number): number => {
  const v = process.env[key];
  return v ? parseInt(v, 10) : fallback;
};

const zhiqueToken = parseSkillAccessToken(env('ELDERLY_SKILL_ACCESS_TOKEN', ''));
const useMockCms = envBool('USE_MOCK_CMS', false);
const cmsProvider = normalizeCmsProvider(
  env('CMS_PROVIDER', useMockCms ? 'mock' : 'zhique')
);

export const config = {
  port: envInt('PORT', 3200),

  cms: {
    provider: cmsProvider,
    baseUrl: env('CMS_BASE_URL', 'http://cms-internal:8080/internal/v1'),
    token: env('CMS_INTERNAL_TOKEN', ''),
    timeoutMs: envInt('CMS_TIMEOUT_MS', 2000),
    useMock: cmsProvider === 'mock',
  },

  zhique: {
    baseUrl: env('ZHIQUE_API_BASE_URL', 'https://business.myxbx.com/hm'),
    appId: zhiqueToken.appId || env('ZHIQUE_APP_ID', ''),
    appSecret: zhiqueToken.appSecret || env('ZHIQUE_APP_SECRET', ''),
    orgCode: zhiqueToken.orgCode || env('ZHIQUE_ORG_CODE', ''),
    timeoutMs: envInt('ZHIQUE_API_TIMEOUT_MS', 10000),
  },

  redis: {
    enabled: envBool('USE_REDIS', !useMockCms),
    url: env('REDIS_URL', 'redis://127.0.0.1:6379'),
    keyPrefix: 'skill:elderly:',
  },

  cacheTtl: {
    activities: envInt('CACHE_TTL_ACTIVITIES', 600),      // 10 分钟
    courses: envInt('CACHE_TTL_COURSES', 3600),            // 1 小时
    clubs: envInt('CACHE_TTL_CLUBS', 3600),                // 1 小时
    mealPoints: envInt('CACHE_TTL_MEAL_POINTS', 3600),     // 1 小时
    homeCareStations: envInt('CACHE_TTL_STATIONS', 3600),  // 1 小时
  },

  rateLimit: {
    defaultQps: envInt('RATE_LIMIT_QPS', 50),
    windowMs: 1000,
  },

  resilience: {
    halfOpenAfterMs: envInt('CIRCUIT_HALF_OPEN_MS', 30000),
    failureThreshold: envInt('CIRCUIT_FAILURE_THRESHOLD', 5),
  },

  channels: JSON.parse(
    env('CHANNELS_CONFIG', JSON.stringify([
      {
        channelId: 'ch_default',
        name: '默认渠道',
        token: 'sk-default-dev-token',
        rateLimit: 50,
        enabled: true,
      },
    ]))
  ),
} as const;

// ---- 请求参数校验 schema ----

export const activitiesQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD').optional(),
  community: z.string().optional(),
  category: z.string().optional().transform((v) => v?.split(',').filter(Boolean)),
});

export const coursesQuerySchema = z.object({
  community: z.string().optional(),
  category: z.string().optional().transform((v) => v?.split(',').filter(Boolean)),
});

export const clubsQuerySchema = z.object({
  community: z.string().optional(),
  category: z.string().optional().transform((v) => v?.split(',').filter(Boolean)),
});

export const mealPointsQuerySchema = z.object({
  district: z.string().optional(),
  street: z.string().optional(),
});

export const homeCareStationsQuerySchema = z.object({
  district: z.string().optional(),
  street: z.string().optional(),
  service: z.string().optional(),
});

function normalizeCmsProvider(value: string): 'cms' | 'mock' | 'zhique' {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'mock') return 'mock';
  if (normalized === 'zhique') return 'zhique';
  return 'cms';
}

function resolveEnvFilePath(
  value: string | undefined,
  baseDir: string,
  fallbackRelativePath: string
): string {
  if (!value) {
    return path.resolve(baseDir, fallbackRelativePath);
  }

  return path.isAbsolute(value) ? value : path.resolve(baseDir, value);
}

function parseSkillAccessToken(
  token: string
): { appId: string; appSecret: string; orgCode: string } {
  const raw = token.trim();
  if (!raw) {
    return { appId: '', appSecret: '', orgCode: '' };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Record<'appId' | 'appSecret' | 'orgCode', string>>;
    return {
      appId: parsed.appId?.trim() ?? '',
      appSecret: parsed.appSecret?.trim() ?? '',
      orgCode: parsed.orgCode?.trim() ?? '',
    };
  } catch {
    // Fall through to URL-style parsing.
  }

  const params = new URLSearchParams(raw);
  if (params.has('appId') || params.has('appSecret') || params.has('orgCode')) {
    return {
      appId: params.get('appId')?.trim() ?? '',
      appSecret: params.get('appSecret')?.trim() ?? '',
      orgCode: params.get('orgCode')?.trim() ?? '',
    };
  }

  const [appId = '', appSecret = '', orgCode = ''] = raw.split('|');
  return {
    appId: appId.trim(),
    appSecret: appSecret.trim(),
    orgCode: orgCode.trim(),
  };
}
