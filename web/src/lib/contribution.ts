// 贡献度计算逻辑

import { prisma } from '@/lib/prisma'
import type { ContributionType } from '@/lib/prisma-types'
import { CONTRIBUTION_POINTS, getUserLevel } from './badge-system'

/**
 * 添加贡献度并更新用户等级
 */
export async function addContribution({
  userId,
  type,
  points,
  description,
  relatedId,
}: {
  userId: string
  type: ContributionType
  points: number
  description?: string
  relatedId?: string
}) {
  // 使用事务确保数据一致性
  // @ts-expect-error - Prisma interactive transaction type inference issue
  return await prisma.$transaction(async (tx) => {
    // 1. 创建贡献度日志
    await tx.contributionLog.create({
      data: {
        userId,
        type,
        points,
        description,
        relatedId,
      },
    })

    // 2. 获取用户当前贡献度
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { contributionPoints: true, level: true },
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    // 3. 计算新的贡献度
    const newPoints = Math.max(0, user.contributionPoints + points)

    // 4. 根据新贡献度计算等级
    const newLevel = getUserLevel(newPoints)

    // 5. 更新用户数据
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        contributionPoints: newPoints,
        level: newLevel.level,
      },
      select: {
        id: true,
        contributionPoints: true,
        level: true,
      },
    })

    return {
      user: updatedUser,
      levelUp: newLevel.level > user.level,
      oldLevel: user.level,
      newLevel: newLevel.level,
    }
  })
}

/**
 * 发表评分时添加贡献度
 */
export async function addRatingContribution(userId: string, ratingId: string) {
  return addContribution({
    userId,
    type: 'RATING',
    points: CONTRIBUTION_POINTS.RATING,
    description: '发表评分',
    relatedId: ratingId,
  })
}

/**
 * 发表评论时添加贡献度
 */
export async function addCommentContribution(userId: string, commentId: string) {
  return addContribution({
    userId,
    type: 'COMMENT',
    points: CONTRIBUTION_POINTS.COMMENT,
    description: '发表评论',
    relatedId: commentId,
  })
}

/**
 * 回复评分时添加贡献度
 */
export async function addRatingReplyContribution(userId: string, replyId: string) {
  return addContribution({
    userId,
    type: 'RATING_REPLY',
    points: CONTRIBUTION_POINTS.RATING_REPLY,
    description: '回复评分',
    relatedId: replyId,
  })
}

/**
 * 完成章节阅读时添加贡献度
 */
export async function addChapterReadContribution(userId: string, chapterId: string) {
  return addContribution({
    userId,
    type: 'CHAPTER_READ',
    points: CONTRIBUTION_POINTS.CHAPTER_READ,
    description: '完成章节阅读',
    relatedId: chapterId,
  })
}

/**
 * 每日阅读奖励
 */
export async function addDailyReadContribution(userId: string) {
  // 检查今天是否已经获得过每日阅读奖励
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existingLog = await prisma.contributionLog.findFirst({
    where: {
      userId,
      type: 'DAILY_READ',
      createdAt: {
        gte: today,
      },
    },
  })

  if (existingLog) {
    return null // 今天已经获得过奖励
  }

  return addContribution({
    userId,
    type: 'DAILY_READ',
    points: CONTRIBUTION_POINTS.DAILY_READ,
    description: '每日阅读奖励',
  })
}

/**
 * 获取用户贡献度历史
 */
export async function getUserContributionHistory(
  userId: string,
  options: {
    limit?: number
    offset?: number
    type?: ContributionType
  } = {}
) {
  const { limit = 20, offset = 0, type } = options

  const logs = await prisma.contributionLog.findMany({
    where: {
      userId,
      ...(type && { type }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  })

  const total = await prisma.contributionLog.count({
    where: {
      userId,
      ...(type && { type }),
    },
  })

  return {
    logs,
    total,
    hasMore: offset + logs.length < total,
  }
}

/**
 * 获取用户贡献度统计
 */
export async function getUserContributionStats(userId: string) {
  // @ts-ignore - Prisma groupBy type inference issue
  const stats = await prisma.contributionLog.groupBy({
    by: ['type'],
    where: { userId },
    _sum: {
      points: true,
    },
    _count: {
      id: true,
    },
  })

  return stats.map((stat: any) => ({
    type: stat.type,
    totalPoints: stat._sum.points || 0,
    count: stat._count.id,
  }))
}
