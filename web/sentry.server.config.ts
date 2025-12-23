import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 调整采样率
  tracesSampleRate: 1.0, // 生产环境建议降低到 0.1-0.3

  // 设置环境
  environment: process.env.NODE_ENV || 'development',

  // 仅在生产环境启用
  enabled: process.env.NODE_ENV === 'production',

  // 过滤敏感信息
  beforeSend(event, hint) {
    // 移除敏感数据
    if (event.request) {
      delete event.request.cookies
      // 移除可能包含敏感信息的 headers
      if (event.request.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
      }
    }

    // 移除环境变量中的敏感信息
    if (event.contexts?.runtime?.env) {
      const env = event.contexts.runtime.env as Record<string, any>
      Object.keys(env).forEach((key) => {
        if (
          key.includes('SECRET') ||
          key.includes('KEY') ||
          key.includes('PASSWORD') ||
          key.includes('TOKEN')
        ) {
          delete env[key]
        }
      })
    }

    return event
  },

  // 忽略特定错误
  ignoreErrors: [
    // 数据库连接错误（避免噪音）
    'P1001', // Prisma: Can't reach database server
    'ECONNREFUSED',
    // 客户端中断的请求
    'ECONNRESET',
    'AbortError',
  ],
})
