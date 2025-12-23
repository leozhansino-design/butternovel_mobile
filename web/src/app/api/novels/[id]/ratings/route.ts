// src/app/api/novels/[id]/ratings/route.ts
// Get novel ratings list with pagination

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parsePaginationParams, createPaginationResponse } from '@/lib/pagination'
import { errorResponse, ErrorCode } from '@/lib/api-response'
import { auth } from '@/lib/auth'
import crypto from 'crypto'

// 生成游客ID
function generateGuestId(ipAddress: string, userAgent: string): string {
  const data = `${ipAddress}:${userAgent}`
  return crypto.createHash('md5').update(data).digest('hex')
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const novelId = parseInt(id)

    if (isNaN(novelId)) {
      return errorResponse('Invalid novel ID', ErrorCode.BAD_REQUEST)
    }

    // 获取当前用户信息（用于检查点赞状态）
    const session = await auth()
    const userId = session?.user?.id || null
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const guestId = userId ? null : generateGuestId(ipAddress, userAgent)

    // ✅ Use pagination utility
    const { page, limit, offset } = parsePaginationParams(request.url, {
      defaultLimit: 10,
      maxLimit: 50,
    })

    // Get sort parameter from query string
    const url = new URL(request.url)
    const sortBy = url.searchParams.get('sortBy') || 'likes' // 'likes' or 'newest'

    // Get ratings list (only with reviews)
    let ratings
    try {
      // ✅ Sort by likes or newest
      const orderBy = sortBy === 'newest'
        ? [{ createdAt: 'desc' as const }]
        : [{ likeCount: 'desc' as const }, { createdAt: 'desc' as const }]

      ratings = await prisma.rating.findMany({
        where: {
          novelId,
          review: {
            not: null,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              contributionPoints: true,
              level: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }) as any[]
    } catch (error) {
      // 如果likeCount字段不存在，只按时间排序
      ratings = await prisma.rating.findMany({
        where: {
          novelId,
          review: {
            not: null,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              contributionPoints: true,
              level: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }) as any[]
    }

    // 🔧 FIXED: 批量查询点赞状态，避免N+1查询问题
    // 之前：每个rating单独查询一次 (N次查询)
    // 现在：一次性批量查询所有点赞状态 (1次查询)
    let userLikes: any[] = []
    try {
      if (ratings.length > 0) {
        const ratingIds = ratings.map(r => r.id)
        userLikes = await prisma.ratingLike.findMany({
          where: userId
            ? { userId, ratingId: { in: ratingIds } }
            : { guestId, ratingId: { in: ratingIds } },
          select: { ratingId: true }
        })
      }
    } catch (error) {
      // RatingLike表还不存在，返回空数组
    }

    // 创建点赞状态的Set，用于快速查找
    const likedRatingIds = new Set(userLikes.map(like => like.ratingId))

    // 在内存中组合数据，不需要额外的数据库查询
    const ratingsWithLikeStatus = ratings.map(rating => {
      const likeCount = (rating as any).likeCount || 0
      const replyCount = (rating as any)._count?.replies || 0

      return {
        ...rating,
        likeCount,
        userHasLiked: likedRatingIds.has(rating.id),
        replyCount,
        _count: undefined, // Remove _count from response
      }
    })

    // Get total count
    const total = await prisma.rating.count({
      where: {
        novelId,
        review: {
          not: null,
        },
      },
    })

    // ✅ Create standardized pagination response
    const pagination = createPaginationResponse({ page, limit, offset }, total)

    // Return data directly for backward compatibility with frontend
    return NextResponse.json({
      ratings: ratingsWithLikeStatus,
      pagination,
    })
  } catch (error) {
    return errorResponse('Failed to fetch ratings', ErrorCode.INTERNAL_ERROR)
  }
}
