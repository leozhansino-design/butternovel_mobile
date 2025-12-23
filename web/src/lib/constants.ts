/**
 * 应用常量
 * 集中管理所有硬编码的配置值
 */

/**
 * 小说分类
 * 与数据库 scripts/seed-categories.ts 保持同步
 */
export const CATEGORIES = [
  { name: 'Fantasy', slug: 'fantasy', order: 1 },
  { name: 'Urban', slug: 'urban', order: 2 },
  { name: 'Romance', slug: 'romance', order: 3 },
  { name: 'Sci-Fi', slug: 'sci-fi', order: 4 },
  { name: 'Mystery', slug: 'mystery', order: 5 },
  { name: 'Historical', slug: 'historical', order: 6 },
  { name: 'Adventure', slug: 'adventure', order: 7 },
  { name: 'Horror', slug: 'horror', order: 8 },
  { name: 'Crime', slug: 'crime', order: 9 },
  { name: 'LGBTQ+', slug: 'lgbtq', order: 10 },
  { name: 'Paranormal', slug: 'paranormal', order: 11 },
  { name: 'System', slug: 'system', order: 12 },
  { name: 'Reborn', slug: 'reborn', order: 13 },
  { name: 'Revenge', slug: 'revenge', order: 14 },
  { name: 'Fanfiction', slug: 'fanfiction', order: 15 },
  { name: 'Humor', slug: 'humor', order: 16 },
  { name: 'Werewolf', slug: 'werewolf', order: 17 },
  { name: 'Vampire', slug: 'vampire', order: 18 },
] as const

/**
 * 小说状态
 */
export const NOVEL_STATUS = {
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
} as const

/**
 * 小说状态显示文本
 */
export const NOVEL_STATUS_LABELS = {
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
} as const

/**
 * 用户角色
 */
export const USER_ROLES = {
  READER: 'reader',
  WRITER: 'writer',
  ADMIN: 'admin',
} as const

/**
 * 分页配置
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
  NOVELS_PER_PAGE: 20,
  CHAPTERS_PER_PAGE: 50,
  COMMENTS_PER_PAGE: 20,
} as const

/**
 * 缓存配置
 */
export const CACHE = {
  // ISR重新验证时间（秒）
  REVALIDATE_HOME: 3600,      // 1小时
  REVALIDATE_CATEGORY: 1800,  // 30分钟
  REVALIDATE_NOVEL: 600,      // 10分钟
  REVALIDATE_CHAPTER: 300,    // 5分钟
} as const

/**
 * 图片配置
 */
export const IMAGES = {
  COVER_WIDTH: 300,
  COVER_HEIGHT: 450,
  AVATAR_SIZE: 128,
  QUALITY: 'auto:good',
  FORMAT: 'auto',
} as const

/**
 * 验证规则
 */
export const VALIDATION = {
  NOVEL_TITLE_MIN: 3,
  NOVEL_TITLE_MAX: 200,
  NOVEL_BLURB_MIN: 10,
  NOVEL_BLURB_MAX: 2000,
  CHAPTER_TITLE_MIN: 1,
  CHAPTER_TITLE_MAX: 200,
  CHAPTER_CONTENT_MIN: 10,
  CHAPTER_CONTENT_MAX: 50000,
  COMMENT_MIN: 1,
  COMMENT_MAX: 1000,
  RATING_MIN: 2,
  RATING_MAX: 10,
  TAG_MIN: 2,
  TAG_MAX: 30,
  TAG_MAX_COUNT: 10,
} as const

/**
 * 搜索配置
 */
export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS: 200,
  SUGGESTIONS_LIMIT: 10,
  DEBOUNCE_MS: 300,
} as const

/**
 * 速率限制配置
 * （这里声明，实际实现在 rate-limit.ts）
 */
export const RATE_LIMITS = {
  SEARCH_WINDOW: 10,    // 秒
  SEARCH_MAX: 10,       // 次
  RATING_WINDOW: 60,    // 秒
  RATING_MAX: 5,        // 次
  COMMENT_WINDOW: 60,   // 秒
  COMMENT_MAX: 10,      // 次
  UPLOAD_WINDOW: 60,    // 秒
  UPLOAD_MAX: 3,        // 次
} as const

/**
 * 外部链接
 */
export const EXTERNAL_LINKS = {
  GITHUB: 'https://github.com/butternovel',
  TWITTER: 'https://twitter.com/butternovel',
  DISCORD: 'https://discord.gg/butternovel',
} as const

/**
 * 联系信息
 */
export const CONTACT = {
  EMAIL: 'support@butternovel.com',
  BUSINESS_EMAIL: 'business@butternovel.com',
} as const
