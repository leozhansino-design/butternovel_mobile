import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params
    const { searchParams } = new URL(request.url)

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Support both User.id and email for backward compatibility
    const isEmail = userId.includes('@')
    const user = await prisma.user.findUnique({
      where: isEmail ? { email: userId } : { id: userId },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Query novels by both user.id and user.email (for backward compatibility)
    // Old novels may have email as authorId, new ones use user.id
    const [novels, totalCount] = await Promise.all([
      prisma.novel.findMany({
        where: {
          OR: [
            { authorId: user.id },
            { authorId: user.email }
          ],
          isPublished: true
        },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          isPublished: true,
          status: true,
          viewCount: true,
          likeCount: true,
          _count: {
            select: {
              chapters: true,
              ratings: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.novel.count({
        where: {
          OR: [
            { authorId: user.id },
            { authorId: user.email }
          ],
          isPublished: true
        }
      })
    ])

    return NextResponse.json({
      novels,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + novels.length < totalCount
      }
    })
  } catch (error) {
    console.error('[Novels API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
