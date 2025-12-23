import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params
    const { searchParams } = new URL(request.url)

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 🔧 FIX: Add pagination to prevent fetching thousands of records
    // This prevents connection pool exhaustion from large queries
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 per page
    const offset = (page - 1) * limit

    // 🔧 FIX: Use withRetry for database resilience
    const [historyEntries, totalCount] = (await Promise.all([
      withRetry(
        () => prisma.readingHistory.findMany({
          where: { userId },
          include: {
            novel: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
                authorName: true,
                status: true,
                totalChapters: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            lastReadAt: 'desc'
          },
          take: limit,
          skip: offset,
        }),
        { operationName: 'Get reading history' }
      ),

      withRetry(
        () => prisma.readingHistory.count({
          where: { userId }
        }),
        { operationName: 'Count reading history' }
      ),
    ])) as [any[], number]

    const novels = historyEntries.map(entry => ({
      id: entry.novel.id,
      title: entry.novel.title,
      slug: entry.novel.slug,
      coverImage: entry.novel.coverImage,
      authorName: entry.novel.authorName,
      status: entry.novel.status,
      totalChapters: entry.novel.totalChapters,
      categoryName: entry.novel.category.name,
      lastReadAt: entry.lastReadAt.toISOString()
    }))

    return NextResponse.json({
      novels,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + limit < totalCount,
      }
    })
  } catch (error: unknown) {
    // 🔧 FIX: Better error logging for debugging
    console.error('[Reading History API] Error fetching history:', error)

    // Check for specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string }

      // P1001: Can't reach database server
      if (prismaError.code === 'P1001') {
        console.error('[Reading History API] Database connection failed')
        return NextResponse.json(
          { error: 'Database connection error. Please try again.' },
          { status: 503 }
        )
      }

      // P1008: Operations timed out
      if (prismaError.code === 'P1008') {
        console.error('[Reading History API] Database timeout')
        return NextResponse.json(
          { error: 'Request timed out. Please try again.' },
          { status: 504 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
