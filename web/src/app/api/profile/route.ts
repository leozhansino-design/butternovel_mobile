// src/app/api/profile/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'
import { validateWithSchema, profileUpdateSchema } from '@/lib/validators'

// GET - 获取用户资料和统计
export const GET = withErrorHandling(async () => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      bio: true,
      contributionPoints: true,
      level: true,
      totalReadingTime: true,
      libraryPrivacy: true,  // Include privacy setting
      _count: {
        select: {
          library: true,
          ratings: true,
        }
      }
    }
  })

  if (!user) {
    return errorResponse('User not found', 404, 'USER_NOT_FOUND')
  }

  // 获取读过的书数量（从 ReadingHistory 统计唯一的小说）
  const booksReadRecords = await prisma.readingHistory.findMany({
    where: { userId: session.user.id },
    select: { novelId: true },
    distinct: ['novelId']
  })
  const booksRead = booksReadRecords.length

  // 获取关注数和粉丝数 (如果 Follow 表不存在则返回 0)
  let following = 0
  let followers = 0
  try {
    following = await prisma.follow.count({
      where: { followerId: session.user.id }
    })
    followers = await prisma.follow.count({
      where: { followingId: session.user.id }
    })
  } catch (error) {
    // Follow 表不存在，使用默认值 0
  }

  return successResponse({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      contributionPoints: user.contributionPoints,
      level: user.level,
      stats: {
        booksRead: booksRead, // 读过的书数量（唯一小说）
        following: following, // 关注数
        followers: followers, // 粉丝数
        totalRatings: user._count.ratings, // 评分数
        readingTime: user.totalReadingTime, // 阅读时长（分钟）
      }
    }
  })
})

// PATCH - 更新用户资料
export const PATCH = withErrorHandling(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const body = await request.json()

  // ✅ 使用 Zod 验证
  const validation = validateWithSchema(profileUpdateSchema, body)
  if (!validation.success) {
    return errorResponse(validation.error, 400, 'VALIDATION_ERROR')
  }

  const { name, bio } = validation.data

  // ✅ 先检查用户是否存在 (防止 OAuth 用户被删除后仍有 session)
  const existingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true }
  })

  if (!existingUser) {
    return errorResponse('User not found', 404, 'USER_NOT_FOUND')
  }

  // ⚠️ CRITICAL: Reserve "butterpicks" name for admin/official accounts only
  if (name !== undefined) {
    const normalizedName = name.trim().toLowerCase()
    const isReservedName = normalizedName === 'butterpicks' || normalizedName.includes('butterpicks')

    if (isReservedName && existingUser.role !== 'ADMIN') {
      return errorResponse(
        'This name is reserved for official accounts. Please choose a different name.',
        400,
        'RESERVED_NAME'
      )
    }
  }

  // 更新用户
  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(bio !== undefined && { bio: bio.trim() || null })
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      bio: true
    }
  })

  return successResponse({ user: updatedUser })
})
