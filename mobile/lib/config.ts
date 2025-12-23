/**
 * 移动端配置
 *
 * 开发时：使用本地 web 服务 http://localhost:3000
 * 生产时：使用线上域名
 */

// TODO: 替换为你的实际域名
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.3:3000'  // 本地开发时使用电脑 IP
  : 'https://butternovel.com'  // 生产环境域名

export const API_ENDPOINTS = {
  // 短篇小说
  SHORTS_LIST: '/api/mobile/shorts',
  SHORTS_DETAIL: (id: string) => `/api/mobile/shorts/${id}`,

  // 用户认证
  AUTH_LOGIN: '/api/auth/callback/credentials',
  AUTH_REGISTER: '/api/auth/register',

  // 书架
  LIBRARY: '/api/library',
  LIBRARY_CHECK: '/api/library/check',

  // 搜索
  SEARCH: '/api/search',
  SEARCH_SUGGESTIONS: '/api/search/suggestions',

  // 用户
  PROFILE: '/api/profile',
  READING_HISTORY: '/api/reading-history',
}

export const APP_CONFIG = {
  // 分页
  DEFAULT_PAGE_SIZE: 20,

  // 缓存时间（毫秒）
  CACHE_STALE_TIME: 5 * 60 * 1000, // 5分钟

  // 自动刷新间隔
  REFETCH_INTERVAL: 30 * 60 * 1000, // 30分钟
}
