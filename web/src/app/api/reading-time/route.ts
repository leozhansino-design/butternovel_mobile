// src/app/api/reading-time/route.ts
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  handleApiError,
  ErrorCode,
} from '@/lib/api-response'

// POST - Update reading time
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { chapterId, novelId, duration } = body // duration in seconds

    if (!chapterId || !novelId || duration === undefined) {
      return errorResponse('Missing required fields', ErrorCode.BAD_REQUEST)
    }

    if (duration < 0 || duration > 3600) {
      // 最多1小时
      return errorResponse('Invalid duration', ErrorCode.BAD_REQUEST)
    }

    // Create reading session
    const session_record = await prisma.readingSession.create({
      data: {
        userId: session.user.id,
        chapterId: parseInt(chapterId),
        novelId: parseInt(novelId),
        duration: parseInt(duration),
        endTime: new Date(),
      },
    })

    // Update user's total reading time (convert seconds to minutes)
    const durationInMinutes = Math.round(duration / 60)

    if (durationInMinutes > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          totalReadingTime: {
            increment: durationInMinutes,
          },
        },
      })
    }

    return successResponse({
      sessionId: session_record.id,
      durationInMinutes,
      message: 'Reading time saved',
    })
  } catch (error) {
    return handleApiError(error, 'Failed to save reading time')
  }
}

// GET - Get user's total reading time
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return unauthorizedResponse()
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totalReadingTime: true },
    })

    return successResponse({
      totalReadingTime: user?.totalReadingTime || 0,
    })
  } catch (error) {
    return handleApiError(error, 'Failed to fetch reading time')
  }
}
