/**
 * 内存限流器
 * 基于滑动窗口算法，不依赖外部服务
 *
 * 策略：
 * - 只对写操作限流（搜索、评分、评论等）
 * - 不对读操作限流（查看小说、章节等）
 * - 不影响正常读者和作者使用
 */

interface RateLimitConfig {
  interval: number // 时间窗口（毫秒）
  limit: number    // 窗口内最大请求数
}

interface RateLimitEntry {
  timestamps: number[]
}

class MemoryRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // 每5分钟清理一次过期数据
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * 检查是否超出速率限制
   */
  check(key: string, config: RateLimitConfig): {
    success: boolean
    limit: number
    remaining: number
    reset: number
  } {
    const now = Date.now()
    const entry = this.store.get(key) || { timestamps: [] }

    // 移除窗口外的旧时间戳
    entry.timestamps = entry.timestamps.filter(
      (timestamp) => now - timestamp < config.interval
    )

    const success = entry.timestamps.length < config.limit

    if (success) {
      // 允许请求，记录时间戳
      entry.timestamps.push(now)
      this.store.set(key, entry)
    }

    // remaining 表示"这次请求后还能发多少个"
    const remaining = Math.max(0, config.limit - entry.timestamps.length)

    // 计算重置时间（最早的时间戳 + 窗口时间）
    const oldestTimestamp = entry.timestamps[0] || now
    const reset = oldestTimestamp + config.interval

    return {
      success,
      limit: config.limit,
      remaining,
      reset,
    }
  }

  /**
   * 清理过期数据
   */
  private cleanup() {
    const now = Date.now()
    const maxAge = 15 * 60 * 1000 // 15分钟

    for (const [key, entry] of this.store.entries()) {
      // 移除超过15分钟无活动的条目
      const latestTimestamp = entry.timestamps[entry.timestamps.length - 1]
      if (latestTimestamp && now - latestTimestamp > maxAge) {
        this.store.delete(key)
      }
    }
  }

  /**
   * 清理定时器（用于测试或关闭应用）
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// 全局限流器实例
const limiter = new MemoryRateLimiter()

/**
 * 速率限制配置
 * 根据操作类型选择不同的限制策略
 */
export const rateLimitConfigs = {
  // 搜索：每10秒最多10次
  search: {
    interval: 10 * 1000,
    limit: 10,
  },
  // 评分：每分钟最多5次
  rating: {
    interval: 60 * 1000,
    limit: 5,
  },
  // 评论：每分钟最多10次
  comment: {
    interval: 60 * 1000,
    limit: 10,
  },
  // 注册/登录：每小时最多5次
  auth: {
    interval: 60 * 60 * 1000,
    limit: 5,
  },
  // 上传：每分钟最多3次
  upload: {
    interval: 60 * 1000,
    limit: 3,
  },
  // 通用API：每分钟最多30次
  api: {
    interval: 60 * 1000,
    limit: 30,
  },
} as const

/**
 * 应用速率限制
 *
 * @param identifier 唯一标识（通常是IP或用户ID）
 * @param type 限制类型
 * @returns 限制结果
 */
export function rateLimit(
  identifier: string,
  type: keyof typeof rateLimitConfigs = 'api'
) {
  const config = rateLimitConfigs[type]
  const key = `${type}:${identifier}`
  return limiter.check(key, config)
}

/**
 * 从请求中获取标识符
 * 优先使用用户ID，其次使用IP
 */
export function getIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // 尝试获取真实IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`
  }

  if (realIp) {
    return `ip:${realIp}`
  }

  // 回退到匿名
  return 'anonymous'
}

// 导出限流器（用于测试）
export { limiter }
