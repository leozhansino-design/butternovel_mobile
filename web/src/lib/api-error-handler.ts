// src/lib/api-error-handler.ts
// 🛡️ 统一的 API 错误处理

import { NextResponse } from 'next/server'

/**
 * API 错误类型
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 处理 Prisma 错误
 */
function handlePrismaError(error: any): { status: number; message: string; code?: string } {
  // P1001: Can't reach database server
  if (error.code === 'P1001') {
    console.error('❌ 数据库连接失败 (P1001)')
    console.error('💡 请检查 DATABASE_URL 配置')
    console.error('📖 查看修复指南: DATABASE_FIX.md\n')

    return {
      status: 503,
      message: 'Database connection failed. Please contact support.',
      code: 'DATABASE_CONNECTION_ERROR'
    }
  }

  // P1002: Database server timeout
  if (error.code === 'P1002') {
    return {
      status: 504,
      message: 'Database server timeout',
      code: 'DATABASE_TIMEOUT'
    }
  }

  // P2002: Unique constraint violation
  if (error.code === 'P2002') {
    const target = error.meta?.target?.[0] || 'field'
    return {
      status: 409,
      message: `A record with this ${target} already exists`,
      code: 'DUPLICATE_RECORD'
    }
  }

  // P2003: Foreign key constraint violation
  if (error.code === 'P2003') {
    const field = error.meta?.field_name || 'reference'
    return {
      status: 404,
      message: `Referenced ${field} not found`,
      code: 'FOREIGN_KEY_CONSTRAINT_FAILED'
    }
  }

  // P2025: Record not found
  if (error.code === 'P2025') {
    return {
      status: 404,
      message: 'Record not found',
      code: 'NOT_FOUND'
    }
  }

  // 其他 Prisma 错误
  console.error('Prisma Error:', error.code, error.message)
  return {
    status: 500,
    message: 'Database operation failed',
    code: 'DATABASE_ERROR'
  }
}

/**
 * 统一错误处理包装器
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (error: any) {
      console.error('API Error:', error)

      // ApiError
      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
          },
          { status: error.statusCode }
        )
      }

      // Prisma Error - check by error name and code pattern (P1xxx, P2xxx, etc.)
      if (error.name === 'PrismaClientKnownRequestError' || (error.code && /^P\d{4}$/.test(error.code))) {
        const { status, message, code } = handlePrismaError(error)
        return NextResponse.json(
          {
            error: message,
            code,
          },
          { status }
        )
      }

      // Prisma Initialization Error (P1001等)
      if (error.name === 'PrismaClientInitializationError' || error.code === 'P1001') {
        const { status, message, code } = handlePrismaError(error)
        return NextResponse.json(
          {
            error: message,
            code,
          },
          { status }
        )
      }

      // Generic Error
      return NextResponse.json(
        {
          error: process.env.NODE_ENV === 'development'
            ? error.message
            : 'An unexpected error occurred',
          code: 'INTERNAL_SERVER_ERROR',
        },
        { status: 500 }
      )
    }
  }
}

/**
 * 创建成功响应
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

/**
 * 创建错误响应
 */
export function errorResponse(
  message: string,
  status = 500,
  code?: string
) {
  return NextResponse.json(
    {
      error: message,
      code,
    },
    { status }
  )
}
