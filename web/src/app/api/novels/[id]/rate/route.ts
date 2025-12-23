// src/app/api/novels/[id]/rate/route.ts
// 评分 API - 提交评分+评论

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-utils'
import { validateWithSchema, ratingSchema } from '@/lib/validators'
import { invalidateNovelCache } from '@/lib/cache'
import { addRatingContribution } from '@/lib/contribution'
import { createNotification } from '@/lib/notification-service'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to rate' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const novelId = parseInt(id)

    if (isNaN(novelId)) {
      return NextResponse.json(
        { error: 'Invalid novel ID' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // 🔍 记录请求数据用于调试
    console.log('[Rating API] Request data:', {
      novelId,
      userId: session.user.id,
      body
    })

    // ✅ 使用 Zod 验证
    const validation = validateWithSchema(ratingSchema, body)
    if (!validation.success) {
      // 🔍 详细记录验证失败的原因
      console.error('[Rating API] Validation failed:', {
        novelId,
        userId: session.user.id,
        body,
        error: validation.error,
        details: validation.details
      })

      return NextResponse.json(
        {
          error: validation.error,
          details: validation.details,
          received: body // 返回接收到的数据帮助调试
        },
        { status: 400 }
      )
    }

    const { score, review } = validation.data

    // ⚡ 使用重试机制检查小说是否存在（获取 slug 用于清除缓存）
    const novel = await withRetry(() =>
      prisma.novel.findUnique({
        where: { id: novelId },
        select: {
          id: true,
          slug: true,
          title: true,
          authorId: true,
        }
      })
    ) as any

    if (!novel) {
      return NextResponse.json(
        { error: 'Novel not found' },
        { status: 404 }
      )
    }

    // ⚡ 使用重试机制检查用户是否已经评分
    const existingRating = await withRetry(() =>
      prisma.rating.findUnique({
        where: {
          userId_novelId: {
            userId: session.user.id,
            novelId: novelId,
          },
        },
      })
    )

    if (existingRating) {
      return NextResponse.json(
        { error: 'You have already rated this novel' },
        { status: 409 }
      )
    }

    // ⚡ 优化：创建评分记录并更新小说统计 - 使用聚合查询提升性能
    const result = (await withRetry(async () => {
      // @ts-ignore - Prisma interactive transaction type inference issue
      return await prisma.$transaction(async (tx) => {
      // 创建评分记录
      const rating = await tx.rating.create({
        data: {
          score,
          review: review || null,
          userId: session.user.id,
          novelId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      })

      // ⚡ 使用聚合查询一次性计算平均分和总数，避免加载所有评分数据
      const stats = await tx.rating.aggregate({
        where: { novelId },
        _avg: { score: true },
        _count: true,
      })

      const totalRatings = stats._count
      const averageRating = stats._avg.score || 0

      // 更新小说的评分统计
      await tx.novel.update({
        where: { id: novelId },
        data: {
          averageRating: parseFloat(averageRating.toFixed(1)),
          totalRatings,
        },
      })

      return {
        rating,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalRatings,
      }
    }, {
      timeout: 15000, // ⚡ 设置事务超时为15秒
    })
    })) as unknown as { rating: any; averageRating: number; totalRatings: number }

    // ⚡ 清除小说详情缓存（评分数据已更新）
    await invalidateNovelCache(novel.slug)

    // ⭐ 添加贡献度
    try {
      const contributionResult = await addRatingContribution(session.user.id, result.rating.id)

      // 🔧 FIX: Type-safe check for levelUp property
      if (contributionResult && typeof contributionResult === 'object' && 'levelUp' in contributionResult && contributionResult.levelUp) {
        // User leveled up - future: could trigger notification
        console.log('[Rating API] User leveled up:', {
          userId: session.user.id,
          oldLevel: 'oldLevel' in contributionResult ? contributionResult.oldLevel : 'unknown',
          newLevel: 'newLevel' in contributionResult ? contributionResult.newLevel : 'unknown',
        })
      }
    } catch (error) {
      // 不影响主流程，只记录错误
      console.error('[Rating API] Failed to add contribution:', error)
    }

    // 发送通知给小说作者
    if (novel.authorId !== session.user.id) {
      try {
        await createNotification({
          userId: novel.authorId,
          type: 'NOVEL_RATING',
          actorId: session.user.id,
          data: {
            novelId: novel.id,
            novelSlug: novel.slug,
            novelTitle: novel.title,
            score,
          },
        });
      } catch (error) {
        console.error('[Rating API] Failed to create notification:', error);
      }
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
