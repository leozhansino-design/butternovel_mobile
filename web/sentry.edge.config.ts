import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 调整采样率
  tracesSampleRate: 1.0, // 生产环境建议降低到 0.1-0.3

  // 设置环境
  environment: process.env.NODE_ENV || 'development',

  // 仅在生产环境启用
  enabled: process.env.NODE_ENV === 'production',

  // Edge runtime 有限的集成支持
  integrations: [],

  // 过滤敏感信息
  beforeSend(event, hint) {
    // 移除敏感数据
    if (event.request) {
      delete event.request.cookies
      if (event.request.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
      }
    }
    return event
  },
})
