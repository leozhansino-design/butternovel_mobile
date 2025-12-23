/**
 * 移动端配置
 */

// API 地址
export const API_BASE_URL = 'https://butternovel.com';

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
