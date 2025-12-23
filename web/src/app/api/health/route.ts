// src/app/api/health/route.ts
// 数据库健康检查端点
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()

  try {
    // 简单查询测试连接
    await prisma.$queryRaw`SELECT 1`

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      errorCode: error.code,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      hint: error.code === 'P1001'
        ? 'Database connection failed. Please check DATABASE_URL environment variable.'
        : 'Database query failed.'
    }, { status: 503 })
  }
}
