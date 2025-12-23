// src/app/api/admin/stats/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { withAdminAuth } from '@/lib/admin-middleware'

type TimeRange = 'all' | '1day' | '3days' | '1week' | '1month' | '3months' | '6months' | '1year'

//
function getDateRange(range: TimeRange): { startDate: Date; label: string; days: number } {
  const now = new Date()
  
  switch (range) {
    case '1day':
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      return { startDate: yesterday, label: 'Last 24 Hours', days: 1 }
      
    case '3days':
      const threeDaysAgo = new Date(now)
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      return { startDate: threeDaysAgo, label: 'Last 3 Days', days: 3 }
      
    case '1week':
      const oneWeekAgo = new Date(now)
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      return { startDate: oneWeekAgo, label: 'Last 7 Days', days: 7 }
      
    case '1month':
      const oneMonthAgo = new Date(now)
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      return { startDate: oneMonthAgo, label: 'Last Month', days: 30 }
      
    case '3months':
      const threeMonthsAgo = new Date(now)
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      return { startDate: threeMonthsAgo, label: 'Last 3 Months', days: 90 }
      
    case '6months':
      const sixMonthsAgo = new Date(now)
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      return { startDate: sixMonthsAgo, label: 'Last 6 Months', days: 180 }
      
    case '1year':
      const oneYearAgo = new Date(now)
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      return { startDate: oneYearAgo, label: 'Last Year', days: 365 }
      
    default:
      return { startDate: new Date('2000-01-01'), label: 'All Time', days: 999999 }
  }
}

export const GET = withAdminAuth(async (session, request: Request) => {
  try {

    const url = new URL(request.url)
    const range = (url.searchParams.get('range') as TimeRange) || 'all'
    
    const { startDate, label } = getDateRange(range)

    // 🔄 添加数据库重试机制，解决连接超时问题
    const totalNovels = await withRetry(
      () => prisma.novel.count({
        where: {
          createdAt: { gte: startDate },
          isPublished: true,
          isBanned: false,
        }
      }),
      { operationName: 'Count total novels' }
    )

    const totalUsers = await withRetry(
      () => prisma.user.count({
        where: {
          createdAt: { gte: startDate },
          isActive: true,
        }
      }),
      { operationName: 'Count total users' }
    )

    // ⭐ 修改这里 - 统计时间范围内的真实浏览量
    // 🔄 添加数据库重试机制，解决连接超时问题
    const totalViews = await withRetry(
      () => prisma.novelView.count({
        where: {
          viewedAt: { gte: startDate }
        }
      }),
      { operationName: 'Count total views' }
    )

    return NextResponse.json({
      range,
      label,
      stats: {
        totalNovels,
        totalUsers,
        totalViews,
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
})

export const POST = withAdminAuth(async (session, request: Request) => {
  try {

    const { range } = await request.json()
    const { startDate, label, days } = getDateRange(range)

    let intervalDays = 1
    if (days >= 90) intervalDays = 7
    if (days >= 180) intervalDays = 14
    if (days >= 365) intervalDays = 30

    // ✅ 优化: 使用单次 GROUP BY 查询代替循环查询 (90次 → 3次)
    // 并行执行 3 个查询,按天分组统计
    const [novelsData, usersData, viewsData] = (await Promise.all([
      withRetry(
        () => prisma.$queryRaw<Array<{date: Date, count: bigint}>>`
          SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(*) as count
          FROM "Novel"
          WHERE "createdAt" >= ${startDate}
            AND "isPublished" = true
            AND "isBanned" = false
          GROUP BY DATE_TRUNC('day', "createdAt")
          ORDER BY date ASC
        `,
        { operationName: 'Get novels chart data' }
      ),
      withRetry(
        () => prisma.$queryRaw<Array<{date: Date, count: bigint}>>`
          SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(*) as count
          FROM "User"
          WHERE "createdAt" >= ${startDate}
            AND "isActive" = true
          GROUP BY DATE_TRUNC('day', "createdAt")
          ORDER BY date ASC
        `,
        { operationName: 'Get users chart data' }
      ),
      withRetry(
        () => prisma.$queryRaw<Array<{date: Date, count: bigint}>>`
          SELECT DATE_TRUNC('day', "viewedAt") as date, COUNT(*) as count
          FROM "NovelView"
          WHERE "viewedAt" >= ${startDate}
          GROUP BY DATE_TRUNC('day', "viewedAt")
          ORDER BY date ASC
        `,
        { operationName: 'Get views chart data' }
      )
    ])) as Array<{date: Date, count: bigint}>[]

    // 构建数据 Map 用于快速查找
    const novelsMap = new Map<string, number>()
    const usersMap = new Map<string, number>()
    const viewsMap = new Map<string, number>()

    novelsData.forEach(d => {
      const dateKey = d.date.toISOString().split('T')[0]
      novelsMap.set(dateKey, Number(d.count))
    })

    usersData.forEach(d => {
      const dateKey = d.date.toISOString().split('T')[0]
      usersMap.set(dateKey, Number(d.count))
    })

    viewsData.forEach(d => {
      const dateKey = d.date.toISOString().split('T')[0]
      viewsMap.set(dateKey, Number(d.count))
    })

    // 在内存中构建图表数据
    const chartData = []
    const totalIterations = Math.ceil(days / intervalDays)

    for (let i = totalIterations - 1; i >= 0; i--) {
      const dayStart = new Date(startDate)
      dayStart.setDate(dayStart.getDate() + i * intervalDays)
      dayStart.setHours(0, 0, 0, 0)

      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + intervalDays)

      // 累加时间段内的数据
      let novelsCount = 0
      let usersCount = 0
      let viewsCount = 0

      for (let d = 0; d < intervalDays; d++) {
        const checkDate = new Date(dayStart)
        checkDate.setDate(checkDate.getDate() + d)
        const dateKey = checkDate.toISOString().split('T')[0]

        novelsCount += novelsMap.get(dateKey) || 0
        usersCount += usersMap.get(dateKey) || 0
        viewsCount += viewsMap.get(dateKey) || 0
      }

      let dateLabel = ''
      if (intervalDays === 1) {
        dateLabel = dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (intervalDays === 7) {
        dateLabel = `W${Math.ceil(dayStart.getDate() / 7)}`
      } else if (intervalDays === 14) {
        dateLabel = dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else {
        dateLabel = dayStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      }

      chartData.push({
        date: dateLabel,
        novels: novelsCount,
        users: usersCount,
        views: viewsCount,
      })
    }

    return NextResponse.json({
      range,
      label,
      data: chartData
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    )
  }
})