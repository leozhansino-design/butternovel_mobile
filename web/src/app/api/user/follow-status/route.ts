// src/app/api/user/follow-status/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'

// GET - Check if current user is following a specific user
export const GET = withErrorHandling(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const { searchParams } = new URL(request.url)
  const userIdOrEmail = searchParams.get('userId')

  if (!userIdOrEmail) {
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
      // User doesn't exist, so definitely not following
      return successResponse({ isFollowing: false })
    }

    targetUserId = user.id
  }

  // Return false if Follow table doesn't exist yet
  try {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId
        }
      }
    })

    return successResponse({ isFollowing: !!follow })
  } catch (error) {
    // Follow table doesn't exist yet
    return successResponse({ isFollowing: false })
  }
})
