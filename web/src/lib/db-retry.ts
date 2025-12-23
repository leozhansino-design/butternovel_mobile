// src/lib/db-retry.ts
// 数据库查询重试机制 - 解决连接超时问题

/**
 * 数据库查询重试包装器
 * 当遇到连接问题时自动重试
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    operationName?: string
  } = {}
): Promise<T> {
  const {
    maxRetries = 1,  // 🚨 紧急修复: 减少重试次数避免查询爆炸
    initialDelay = 1000, // 1秒
    maxDelay = 10000,    // 10秒
    operationName = 'Database operation'
  } = options

  let lastError: Error | null = null
  let delay = initialDelay

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()

      return result
    } catch (error: any) {
      lastError = error

      // 检查是否是数据库连接错误
      const isConnectionError =
        error.code === 'P1001' || // Can't reach database server
        error.code === 'P1002' || // Connection timed out
        error.code === 'P1008' || // Operations timed out
        error.code === 'P1017' || // Server has closed the connection
        error.message?.includes("Can't reach database") ||
        error.message?.includes('Connection') ||
        error.message?.includes('timeout')

      // 如果不是连接错误，或者已经是最后一次尝试，直接抛出
      if (!isConnectionError || attempt >= maxRetries) {
        console.error(
          `❌ [DB Retry] ${operationName} failed after ${attempt} attempt(s):`,
          error.message
        )
        throw error
      }

      // 记录重试信息
      console.warn(
        `⚠️ [DB Retry] ${operationName} failed (attempt ${attempt}/${maxRetries}): ${error.message}`
      )

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay))

      // 指数退避：每次延迟翻倍，但不超过最大延迟
      delay = Math.min(delay * 2, maxDelay)
    }
  }

  // 理论上不会到这里，但为了类型安全
  throw lastError || new Error('Operation failed')
}

/**
 * 数据库操作装饰器（用于包装整个函数）
 */
export function withDatabaseRetry(operationName: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      return withRetry(
        () => originalMethod.apply(this, args),
        { operationName }
      )
    }

    return descriptor
  }
}
