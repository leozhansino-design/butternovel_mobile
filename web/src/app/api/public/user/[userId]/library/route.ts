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

    // Check if user exists and if their library is public
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        libraryPrivacy: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If library is private, return empty list
    if (user.libraryPrivacy) {
      return NextResponse.json({
        novels: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasMore: false,
        }
      })
    }

    // 🔧 FIX: Add pagination to prevent fetching thousands of records
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 per page
    const offset = (page - 1) * limit

    // 🔧 FIX: Use withRetry for database resilience
    // Fetch user's library with pagination
    const [libraryEntries, totalCount] = (await Promise.all([
      withRetry(
        () => prisma.library.findMany({
          where: { userId },
          include: {
            novel: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
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
            addedAt: 'desc'
          },
          take: limit,
          skip: offset,
        }),
        { operationName: 'Get library' }
      ),

      withRetry(
        () => prisma.library.count({
          where: { userId }
        }),
        { operationName: 'Count library' }
      ),
    ])) as [any[], number]

    const novels = libraryEntries.map(entry => ({
      id: entry.novel.id,
      title: entry.novel.title,
      slug: entry.novel.slug,
      coverImage: entry.novel.coverImage,
      category: entry.novel.category.name,
      status: entry.novel.status,
      totalChapters: entry.novel.totalChapters,
      addedAt: entry.addedAt.toISOString()
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
    console.error('[Library API] Error fetching library:', error)

    // Check for specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string }

      // P1001: Can't reach database server
      if (prismaError.code === 'P1001') {
        console.error('[Library API] Database connection failed')
        return NextResponse.json(
          { error: 'Database connection error. Please try again.' },
          { status: 503 }
        )
      }

      // P1008: Operations timed out
      if (prismaError.code === 'P1008') {
        console.error('[Library API] Database timeout')
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
