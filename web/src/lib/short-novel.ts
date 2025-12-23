/**
 * ShortNovel 短篇小说常量和工具函数
 *
 * 短篇小说特点：
 * - 15,000 - 50,000 字符
 * - 阅读时间 10-30 分钟
 * - 一口气读完，不分章节
 * - 不需要封面图片
 * - 有专属分类系统
 */

// 短篇小说分类 - 按优先级排序（Romance 和 Face-Slapping 优先）
export const SHORT_NOVEL_GENRES = [
  { id: 'sweet-romance', name: 'Sweet Romance', slug: 'sweet-romance', order: 1 },
  { id: 'billionaire-romance', name: 'Billionaire Romance', slug: 'billionaire-romance', order: 2 },
  { id: 'face-slapping', name: 'Face-Slapping', slug: 'face-slapping', order: 3 },
  { id: 'revenge', name: 'Revenge', slug: 'revenge', order: 4 },
  { id: 'rebirth', name: 'Rebirth', slug: 'rebirth', order: 5 },
  { id: 'regret', name: 'Regret', slug: 'regret', order: 6 },
  { id: 'healing-redemption', name: 'Healing/Redemption', slug: 'healing-redemption', order: 7 },
  { id: 'true-fake-identity', name: 'True/Fake Identity', slug: 'true-fake-identity', order: 8 },
  { id: 'substitute', name: 'Substitute', slug: 'substitute', order: 9 },
  { id: 'age-gap', name: 'Age Gap', slug: 'age-gap', order: 10 },
  { id: 'entertainment-circle', name: 'Entertainment Circle', slug: 'entertainment-circle', order: 11 },
  { id: 'group-pet', name: 'Group Pet', slug: 'group-pet', order: 12 },
  { id: 'lgbtq', name: 'LGBTQ+', slug: 'lgbtq', order: 13 },
  { id: 'quick-transmigration', name: 'Quick Transmigration', slug: 'quick-transmigration', order: 14 },
  { id: 'survival-apocalypse', name: 'Survival/Apocalypse', slug: 'survival-apocalypse', order: 15 },
  { id: 'system', name: 'System', slug: 'system', order: 16 },
] as const

export type ShortNovelGenreId = typeof SHORT_NOVEL_GENRES[number]['id']

// 短篇小说字符数限制
export const SHORT_NOVEL_LIMITS = {
  MIN_CHARACTERS: 15000,
  MAX_CHARACTERS: 50000,
  TITLE_MAX: 80,        // 标题最大80字符
  PREVIEW_MAX: 500,     // 预览内容最大500字符
  MIN_READING_MINUTES: 10,
  MAX_READING_MINUTES: 30,
}

// 获取短篇小说分类名称
export function getShortNovelGenreName(genreId: string): string {
  const genre = SHORT_NOVEL_GENRES.find(g => g.id === genreId)
  return genre?.name || genreId
}

// 获取短篇小说分类 Slug
export function getShortNovelGenreSlug(genreId: string): string {
  const genre = SHORT_NOVEL_GENRES.find(g => g.id === genreId)
  return genre?.slug || genreId
}

// 估算阅读时间（分钟）
export function estimateReadingTime(characterCount: number): number {
  // 平均阅读速度约 1500-2000 字符/分钟（英文）
  const averageSpeed = 1700
  return Math.ceil(characterCount / averageSpeed)
}

// 验证是否符合短篇小说字符数要求
export function validateShortNovelLength(characterCount: number): {
  valid: boolean
  message?: string
} {
  if (characterCount < SHORT_NOVEL_LIMITS.MIN_CHARACTERS) {
    return {
      valid: false,
      message: `Short novel must be at least ${SHORT_NOVEL_LIMITS.MIN_CHARACTERS.toLocaleString()} characters. Current: ${characterCount.toLocaleString()}`
    }
  }
  if (characterCount > SHORT_NOVEL_LIMITS.MAX_CHARACTERS) {
    return {
      valid: false,
      message: `Short novel must not exceed ${SHORT_NOVEL_LIMITS.MAX_CHARACTERS.toLocaleString()} characters. Current: ${characterCount.toLocaleString()}`
    }
  }
  return { valid: true }
}

// 生成预览内容（从完整内容中提取前500字符）
export function generateReadingPreview(content: string, maxLength: number = SHORT_NOVEL_LIMITS.PREVIEW_MAX): string {
  if (content.length <= maxLength) {
    return content
  }
  // 在单词边界处截断，避免截断单词
  const truncated = content.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...'
  }
  return truncated + '...'
}

// 短篇小说默认封面（使用 placeholder）
export const SHORT_NOVEL_DEFAULT_COVER = '/images/short-novel-placeholder.png'

// 格式化阅读时间显示
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) {
    return '< 1 min'
  }
  if (minutes === 1) {
    return '1 min read'
  }
  return `${minutes} min read`
}
