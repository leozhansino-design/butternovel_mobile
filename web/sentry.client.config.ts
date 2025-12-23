import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 调整采样率以控制发送的事件量
  tracesSampleRate: 1.0, // 生产环境建议降低到 0.1-0.3

  // 设置环境
  environment: process.env.NODE_ENV || 'development',

  // 仅在生产环境启用性能监控
  enabled: process.env.NODE_ENV === 'production',

  // Replay 配置
  replaysSessionSampleRate: 0.1, // 会话重放采样率（生产环境建议 0.1）
  replaysOnErrorSampleRate: 1.0, // 错误时的采样率

  // 性能追踪配置
  tracePropagationTargets: ['localhost', /^https:\/\/yoursite\.com/],

  // 过滤敏感信息
  beforeSend(event, hint) {
    // 移除敏感数据
    if (event.request) {
      delete event.request.cookies
    }
    return event
  },

  // 忽略特定错误
  ignoreErrors: [
    // 忽略浏览器扩展错误
    'top.GLOBALS',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'atomicFindClose',
    // 忽略网络错误
    'NetworkError',
    'Network request failed',
    // 忽略取消的请求
    'AbortError',
    'The user aborted a request',
  ],
})
