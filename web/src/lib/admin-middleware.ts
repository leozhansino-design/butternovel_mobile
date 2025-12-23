// src/lib/admin-middleware.ts
// 🛡️ 统一的 Admin 认证中间件

import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'

/**
 * Admin Session 类型
 */
export interface AdminSession {
  id: string
  email: string
  role: string
  name: string
}

/**
 * Admin 认证中间件装饰器
 *
 * 使用示例:
 * ```typescript
 * export const POST = withAdminAuth(async (session, request: Request) => {
 *   // session 已验证,直接使用
 *   const body = await request.json()
 *   // ...
 * })
 * ```
 *
 * @param handler - 处理函数,第一个参数是已验证的 session
 * @returns 包装后的 API 路由处理函数
 */
export function withAdminAuth<T extends any[]>(
  handler: (session: AdminSession, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    // 验证 session
    const session = await getAdminSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 调用实际的处理函数
    return handler(session as AdminSession, ...args)
  }
}

/**
 * 可选: 基于角色的权限检查中间件
 *
 * 使用示例:
 * ```typescript
 * export const DELETE = withAdminRole(['SUPER_ADMIN', 'ADMIN'], async (session, request) => {
 *   // 只有 SUPER_ADMIN 和 ADMIN 可以访问
 * })
 * ```
 */
export function withAdminRole<T extends any[]>(
  allowedRoles: string[],
  handler: (session: AdminSession, ...args: T) => Promise<Response>
) {
  return withAdminAuth<T>(async (session, ...args) => {
    // 检查角色权限
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    return handler(session, ...args)
  })
}
