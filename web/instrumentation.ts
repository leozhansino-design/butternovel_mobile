/**
 * Next.js Instrumentation
 * 用于手动初始化 Sentry 和其他监控工具
 *
 * 参考: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // 仅在生产环境启用 Sentry
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      // Server-side instrumentation
      await import('./sentry.server.config')
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      // Edge runtime instrumentation
      await import('./sentry.edge.config')
    }
  }
}

// 可选：添加其他全局初始化逻辑
export async function onRequestError(
  error: Error,
  request: {
    path: string // URL path
    method: string // HTTP method
    headers: { [key: string]: string } // HTTP headers
  },
  context: {
    routerKind: 'Pages Router' | 'App Router'
    routePath: string // Route path (e.g. /app/blog/[slug]/page.tsx)
    routeType: 'render' | 'route' | 'action' | 'middleware'
    renderSource: 'react-server-components' | 'react-server-components-payload' | 'server-rendering'
    revalidateReason?: 'on-demand' | 'stale'
  }
) {
  // 全局错误处理（可选）
  // 这里可以添加自定义的错误日志逻辑
  console.error('Request error:', {
    error: error.message,
    path: request.path,
    method: request.method,
    route: context.routePath,
  })
}
