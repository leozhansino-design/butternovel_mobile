// src/app/api/profile/ratings/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  unauthorizedResponse,
  handleApiError,
} from '@/lib/api-response'

// GET - 获取用户的评分记录（自己的或指定用户的）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const offset = (page - 1) * limit
    const queryUserId = searchParams.get('userId') // 查询指定用户的评分

    // 如果没有指定userId，则查询当前登录用户
    let userId: string
    if (queryUserId) {
      userId = queryUserId
    } else {
      const session = await auth()
      if (!session?.user?.id) {
        return unauthorizedResponse()
      }
      userId = session.user.id
    }

    // 获取用户的评分记录
    const ratings = await prisma.rating.findMany({
      where: {
        userId,
      },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            authorName: true,
            categoryId: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    const total = await prisma.rating.count({
      where: {
        userId,
      },
    })

    return successResponse({
      ratings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Failed to fetch user ratings')
  }
}
