// src/app/api/dashboard/activities/route.ts

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'

// 定义活动类型
type ActivityType = 'chapter_published' | 'comment' | 'like' | 'rating'

interface Activity {
  type: ActivityType
  timestamp: Date
  data: any
}

// 定义Prisma查询结果类型
interface ChapterWithNovel {
  id: number
  title: string
  createdAt: Date
  novel: {
    id: number
    title: string
    slug: string
  }
}

interface NovelLikeWithNovel {
  id: string
  createdAt: Date
  novel: {
    id: number
    title: string
    slug: string
  }
}

interface RatingWithNovel {
  id: string
  createdAt: Date
  score: number
  novel: {
    id: number
    title: string
    slug: string
  }
}

// GET - Fetch recent activities for the authenticated user
export const GET = withErrorHandling(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  try {
    // Get recent chapters published
    const recentChapters = await prisma.chapter.findMany({
      where: {
        novel: {
          authorId: session.user.id
        },
        isPublished: true
      },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    }) as ChapterWithNovel[]

    // Get recent likes (if available)
    const recentLikes = await prisma.novelLike.findMany({
      where: {
        novel: {
          authorId: session.user.id
        }
      },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    }) as NovelLikeWithNovel[]

    // Get recent ratings
    const recentRatings = await prisma.rating.findMany({
      where: {
        novel: {
          authorId: session.user.id
        }
      },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    }) as RatingWithNovel[]

    // Combine all activities
    const activities: Activity[] = []

    // Add chapter publications
    recentChapters.forEach((chapter: ChapterWithNovel) => {
      activities.push({
        type: 'chapter_published',
        timestamp: chapter.createdAt,
        data: {
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          novelId: chapter.novel.id,
          novelTitle: chapter.novel.title,
          novelSlug: chapter.novel.slug
        }
      })
    })

    // Add likes
    recentLikes.forEach((like: NovelLikeWithNovel) => {
      activities.push({
        type: 'like',
        timestamp: like.createdAt,
        data: {
          novelId: like.novel.id,
          novelTitle: like.novel.title,
          novelSlug: like.novel.slug
        }
      })
    })

    // Add ratings
    recentRatings.forEach((rating: RatingWithNovel) => {
      activities.push({
        type: 'rating',
        timestamp: rating.createdAt,
        data: {
          rating: rating.score / 2, // Convert 2-10 scale to 1-5 stars
          novelId: rating.novel.id,
          novelTitle: rating.novel.title,
          novelSlug: rating.novel.slug
        }
      })
    })

    // Sort by timestamp (most recent first) and take top 10
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    const recentActivities = activities.slice(0, 10)

    return successResponse({
      activities: recentActivities
    })
  } catch (error) {
    console.error('[Dashboard Activities] Failed to fetch activities:', error)
    return errorResponse('Failed to fetch activities', 500, 'FETCH_FAILED')
  }
})
