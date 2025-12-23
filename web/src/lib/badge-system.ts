// 用户等级勋章系统配置

/**
 * 用户等级定义
 */
export interface UserLevel {
  level: number
  name: string
  nameEn: string
  minPoints: number
  maxPoints: number
  description: string
  badgeStyle: BadgeStyle
}

/**
 * 勋章视觉样式
 */
export interface BadgeStyle {
  borderColor: string // 边框颜色
  borderWidth: number // 边框宽度
  glowColor?: string // 发光颜色
  glowIntensity?: number // 发光强度 0-1
  animation?: 'none' | 'pulse' | 'rotate' | 'sparkle' // 动画效果
  gradient?: string[] // 渐变色数组
}

/**
 * 贡献度规则
 */
export const CONTRIBUTION_POINTS = {
  RATING: 10, // 发表评分
  COMMENT: 5, // 发表评论
  RATING_REPLY: 3, // 回复评分
  CHAPTER_READ: 1, // 完成章节阅读
  DAILY_READ: 5, // 每日阅读奖励
} as const

/**
 * 8个等级定义（升级曲线陡峭）
 */
export const USER_LEVELS: UserLevel[] = [
  {
    level: 1,
    name: '新手读者',
    nameEn: 'Novice Reader',
    minPoints: 0,
    maxPoints: 50,
    description: '刚刚开始阅读之旅',
    badgeStyle: {
      borderColor: '#94a3b8',
      borderWidth: 2,
      animation: 'none',
    },
  },
  {
    level: 2,
    name: '活跃读者',
    nameEn: 'Active Reader',
    minPoints: 51,
    maxPoints: 150,
    description: '经常互动的读者',
    badgeStyle: {
      borderColor: '#60a5fa',
      borderWidth: 2,
      glowColor: '#60a5fa',
      glowIntensity: 0.3,
      animation: 'none',
    },
  },
  {
    level: 3,
    name: '资深读者',
    nameEn: 'Veteran Reader',
    minPoints: 151,
    maxPoints: 300,
    description: '阅读经验丰富',
    badgeStyle: {
      borderColor: '#8b5cf6',
      borderWidth: 3,
      glowColor: '#8b5cf6',
      glowIntensity: 0.4,
      animation: 'pulse',
      gradient: ['#8b5cf6', '#a78bfa'],
    },
  },
  {
    level: 4,
    name: '书评达人',
    nameEn: 'Review Expert',
    minPoints: 301,
    maxPoints: 600,
    description: '犀利的书评家',
    badgeStyle: {
      borderColor: '#ec4899',
      borderWidth: 3,
      glowColor: '#ec4899',
      glowIntensity: 0.5,
      animation: 'pulse',
      gradient: ['#ec4899', '#f472b6'],
    },
  },
  {
    level: 5,
    name: '文学鉴赏家',
    nameEn: 'Literature Connoisseur',
    minPoints: 601,
    maxPoints: 1000,
    description: '对文学有独到见解',
    badgeStyle: {
      borderColor: '#f59e0b',
      borderWidth: 4,
      glowColor: '#f59e0b',
      glowIntensity: 0.6,
      animation: 'rotate',
      gradient: ['#f59e0b', '#fbbf24', '#fcd34d'],
    },
  },
  {
    level: 6,
    name: '传奇评论家',
    nameEn: 'Legendary Critic',
    minPoints: 1001,
    maxPoints: 2000,
    description: '社区的意见领袖',
    badgeStyle: {
      borderColor: '#14b8a6',
      borderWidth: 4,
      glowColor: '#14b8a6',
      glowIntensity: 0.7,
      animation: 'rotate',
      gradient: ['#14b8a6', '#2dd4bf', '#5eead4'],
    },
  },
  {
    level: 7,
    name: '殿堂级书友',
    nameEn: 'Hall of Fame',
    minPoints: 2001,
    maxPoints: 5000,
    description: '社区的传奇人物',
    badgeStyle: {
      borderColor: '#ef4444',
      borderWidth: 5,
      glowColor: '#ef4444',
      glowIntensity: 0.8,
      animation: 'sparkle',
      gradient: ['#ef4444', '#f87171', '#fca5a5', '#fde047'],
    },
  },
  {
    level: 8,
    name: '终极书虫',
    nameEn: 'Ultimate Bookworm',
    minPoints: 5001,
    maxPoints: Infinity,
    description: '骨灰级阅读爱好者',
    badgeStyle: {
      borderColor: '#a855f7',
      borderWidth: 6,
      glowColor: '#a855f7',
      glowIntensity: 1,
      animation: 'sparkle',
      gradient: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#fbbf24'],
    },
  },
]

/**
 * 根据贡献度分数获取用户等级
 */
export function getUserLevel(points: number): UserLevel {
  for (let i = USER_LEVELS.length - 1; i >= 0; i--) {
    if (points >= USER_LEVELS[i].minPoints) {
      return USER_LEVELS[i]
    }
  }
  return USER_LEVELS[0]
}

/**
 * 获取下一等级
 */
export function getNextLevel(currentLevel: number): UserLevel | null {
  if (currentLevel >= 8) return null
  return USER_LEVELS[currentLevel]
}

/**
 * 计算升级进度百分比
 */
export function getLevelProgress(points: number, currentLevel: UserLevel): number {
  const { minPoints, maxPoints } = currentLevel
  if (maxPoints === Infinity) return 100

  const progress = ((points - minPoints) / (maxPoints - minPoints)) * 100
  return Math.min(Math.max(progress, 0), 100)
}

/**
 * 获取等级名称（中英文）
 */
export function getLevelName(level: number, lang: 'zh' | 'en' = 'zh'): string {
  const levelData = USER_LEVELS.find(l => l.level === level)
  if (!levelData) return lang === 'zh' ? '未知等级' : 'Unknown Level'
  return lang === 'zh' ? levelData.name : levelData.nameEn
}

/**
 * 格式化阅读时长（英文）
 * @param minutes 总分钟数
 * @returns 格式化的时长字符串 "XX hours XX minutes"
 */
export function formatReadingTime(minutes: number): string {
  if (minutes === 0) {
    return '0 minutes'
  }

  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }

  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}`
}
