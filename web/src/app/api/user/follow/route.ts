// src/app/api/user/follow/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'
import { createNotification } from '@/lib/notification-service'

// POST - Follow a user
export const POST = withErrorHandling(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const { userId: userIdOrEmail } = await request.json()

  if (!userIdOrEmail || typeof userIdOrEmail !== 'string') {
    return errorResponse('User ID is required', 400, 'VALIDATION_ERROR')
  }

  // ⭐ CRITICAL FIX: Support both User.id and email for backward compatibility
  // Old novel records may have email as authorId, new records use User.id
  const isEmail = userIdOrEmail.includes('@')

  // Check if target user exists and get their User.id
  const targetUser = await prisma.user.findUnique({
    where: isEmail ? { email: userIdOrEmail } : { id: userIdOrEmail },
    select: { id: true, email: true }
  })

  if (!targetUser) {
    return errorResponse('User not found', 404, 'USER_NOT_FOUND')
  }

  const targetUserId = targetUser.id

  // Can't follow yourself
  if (targetUserId === session.user.id) {
    return errorResponse('You cannot follow yourself', 400, 'VALIDATION_ERROR')
  }

  // Return error if Follow table doesn't exist yet
  try {
    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId
        }
      }
    })

    if (existingFollow) {
      return errorResponse('Already following this user', 400, 'ALREADY_FOLLOWING')
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: targetUserId
      }
    })

    // 发送通知给被关注的用户
    try {
      await createNotification({
        userId: targetUserId,
        type: 'NEW_FOLLOWER',
        actorId: session.user.id,
        data: {},
      });
    } catch (error) {
      console.error('[Follow API] Failed to create notification:', error);
    }

    return successResponse({ message: 'Successfully followed user' })
  } catch (error) {
    return errorResponse('Follow system not available yet. Please contact administrator.', 503, 'SERVICE_UNAVAILABLE')
  }
})

// DELETE - Unfollow a user
export const DELETE = withErrorHandling(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const { userId: userIdOrEmail } = await request.json()

  if (!userIdOrEmail || typeof userIdOrEmail !== 'string') {
    return errorResponse('User ID is required', 400, 'VALIDATION_ERROR')
  }

  // ⭐ CRITICAL FIX: Support both User.id and email for backward compatibility
  // Old novel records may have email as authorId, new records use User.id
  const isEmail = userIdOrEmail.includes('@')

  let targetUserId = userIdOrEmail

  // If email is provided, convert to User.id
  if (isEmail) {
    const user = await prisma.user.findUnique({
      where: { email: userIdOrEmail },
      select: { id: true }
    })

    if (!user) {
      return errorResponse('User not found', 404, 'USER_NOT_FOUND')
    }

    targetUserId = user.id
  }

  // Return error if Follow table doesn't exist yet
  try {
    // Find and delete the follow relationship
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId
        }
      }
    })

    if (!follow) {
      return errorResponse('Not following this user', 400, 'NOT_FOLLOWING')
    }

    await prisma.follow.delete({
      where: {
        id: follow.id
      }
    })

    return successResponse({ message: 'Successfully unfollowed user' })
  } catch (error) {
    return errorResponse('Follow system not available yet. Please contact administrator.', 503, 'SERVICE_UNAVAILABLE')
  }
})
