import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userEmail = session.user.email

    // Get all novels by this author
    const novels = await prisma.novel.findMany({
      where: {
        authorId: userEmail,
      },
      include: {
        chapters: {
          select: {
            id: true,
          },
        },
        ratings: {
          select: {
            score: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }) as any[]

    // Calculate statistics
    const totalNovels = novels.length
    const totalChapters = novels.reduce((sum, novel) => sum + novel.chapters.length, 0)
    const totalViews = novels.reduce((sum, novel) => sum + novel.viewCount, 0)
    const totalComments = novels.reduce((sum, novel) => sum + novel.comments.length, 0)

    // Calculate average rating across all novels
    let totalRatings = 0
    let ratingSum = 0

    novels.forEach((novel: any) => {
      novel.ratings.forEach((rating: any) => {
        totalRatings++
        ratingSum += rating.score
      })
    })

    const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0

    // Get recent novels (last 5 updated)
    const recentNovels = novels.slice(0, 5).map((novel) => ({
      id: novel.id,
      title: novel.title,
      slug: novel.slug,
      coverImage: novel.coverImage,
      status: novel.status,
      totalChapters: novel.chapters.length,
      viewCount: novel.viewCount,
      averageRating: novel.averageRating,
      updatedAt: novel.updatedAt,
      isPublished: novel.isPublished,
    }))

    return NextResponse.json({
      stats: {
        totalNovels,
        totalChapters,
        totalViews,
        totalComments,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalRatings,
      },
      recentNovels,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
