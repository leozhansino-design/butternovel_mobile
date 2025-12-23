// src/app/api/reading-progress/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  handleApiError,
  ErrorCode
} from '@/lib/api-response'

// POST - Save reading progress
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return unauthorizedResponse()
    }

    const { novelId, chapterId } = await request.json()

    if (!novelId || !chapterId) {
      return errorResponse('Missing required fields', ErrorCode.BAD_REQUEST)
    }

    // Validate chapter exists
    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(chapterId) },
      select: { id: true, novelId: true, chapterNumber: true, title: true }
    })

    if (!chapter) {
      return notFoundResponse('Chapter')
    }

    if (chapter.novelId !== parseInt(novelId)) {
      return errorResponse(
        'Chapter does not belong to novel',
        ErrorCode.BAD_REQUEST
      )
    }

    // Update or create reading history
    await prisma.readingHistory.upsert({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId: parseInt(novelId)
        }
      },
      update: {
        chapterId: parseInt(chapterId),
        lastReadAt: new Date()
      },
      create: {
        userId: session.user.id,
        novelId: parseInt(novelId),
        chapterId: parseInt(chapterId)
      }
    })

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error, 'Failed to save reading progress')
  }
}
