// src/app/api/user/[userId]/following/route.ts
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'

// GET - Get list of users that this user is following
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

  // Get following list (return empty array if Follow table doesn't exist)
  try {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
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
      following: following.map(f => ({
        ...f.following,
        isOfficial: f.following.role === 'ADMIN'  // Mark admin users as official
      }))
    })
  } catch (error) {
    return successResponse({ following: [] })
  }
})
