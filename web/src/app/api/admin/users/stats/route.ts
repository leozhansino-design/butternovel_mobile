// src/app/api/admin/users/stats/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { withAdminAuth } from '@/lib/admin-middleware'

/**
 * 获取用户统计概览
 * GET /api/admin/users/stats
 */
export const GET = withAdminAuth(async () => {
  try {
    const now = new Date()
    const todayStart = new Date(now.setHours(0, 0, 0, 0))
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // 并行获取所有统计数据
    const [
      totalUsers,
      todayUsers,
      weekUsers,
      monthUsers,
      googleUsers,
      facebookUsers,
      emailUsers,
      bannedUsers,
      verifiedUsers,
      writersCount,
      activeUsers,
    ] = await Promise.all([
      // 总用户数
      withRetry(() => prisma.user.count(), { operationName: 'Count total users' }),

      // 今日新增
      withRetry(
        () => prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
        { operationName: 'Count today users' }
      ),

      // 本周新增
      withRetry(
        () => prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
        { operationName: 'Count week users' }
      ),

      // 本月新增
      withRetry(
        () => prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
        { operationName: 'Count month users' }
      ),

      // Google OAuth 用户
      withRetry(
        () => prisma.user.count({ where: { googleId: { not: null } } }),
        { operationName: 'Count Google users' }
      ),

      // Facebook OAuth 用户
      withRetry(
        () => prisma.user.count({ where: { facebookId: { not: null } } }),
        { operationName: 'Count Facebook users' }
      ),

      // 邮箱注册用户（没有 OAuth）
      withRetry(
        () =>
          prisma.user.count({
            where: { googleId: null, facebookId: null },
          }),
        { operationName: 'Count email users' }
      ),

      // 被封禁用户
      withRetry(
        () => prisma.user.count({ where: { isBanned: true } }),
        { operationName: 'Count banned users' }
      ),

      // 已验证用户
      withRetry(
        () => prisma.user.count({ where: { isVerified: true } }),
        { operationName: 'Count verified users' }
      ),

      // 作家数量
      withRetry(
        () => prisma.user.count({ where: { isWriter: true } }),
        { operationName: 'Count writers' }
      ),

      // 活跃用户（有评论或评分或阅读历史）
      withRetry(
        () =>
          prisma.user.count({
            where: {
              OR: [
                { comments: { some: {} } },
                { ratings: { some: {} } },
                { readingHistory: { some: {} } },
              ],
            },
          }),
        { operationName: 'Count active users' }
      ),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        total: totalUsers,
        newUsers: {
          today: todayUsers,
          week: weekUsers,
          month: monthUsers,
        },
        byAuthMethod: {
          google: googleUsers,
          facebook: facebookUsers,
          email: emailUsers,
        },
        byStatus: {
          active: activeUsers,
          banned: bannedUsers,
          verified: verifiedUsers,
        },
        writers: writersCount,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
})
