// src/app/api/user/[userId]/followers/route.ts
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'

// GET - Get list of users who follow this user
export const GET = withErrorHandling(async (
  request: Request,
  context: { params: Promise<{ userId: string }> }
) => {
  const { userId } = await context.params

  if (!userId) {
    return errorResponse('User ID is required', 400, 'VALIDATION_ERROR')
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    return errorResponse('User not found', 404, 'USER_NOT_FOUND')
  }

  // Get followers list (return empty array if Follow table doesn't exist)
  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
            level: true,
            contributionPoints: true,
            role: true  // Include role to determine if official account
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }) as any[]

    return successResponse({
      followers: followers.map(f => ({
        ...f.follower,
        isOfficial: f.follower.role === 'ADMIN'  // Mark admin users as official
      }))
    })
  } catch (error) {
    return successResponse({ followers: [] })
  }
})
