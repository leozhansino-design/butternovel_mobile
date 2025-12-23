// src/app/api/profile/stats/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  unauthorizedResponse,
  handleApiError
} from '@/lib/api-response'

// GET - Get user statistics
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return unauthorizedResponse()
    }

    // ⭐ 修正逻辑：只统计至少完成1个章节的小说
    // 获取所有已完成的章节
    const completedChapters = await prisma.chapterProgress.findMany({
      where: {
        userId: session.user.id,
        isCompleted: true,
      },
      include: {
        chapter: {
          select: {
            novelId: true,
          },
        },
      },
    }) as any[]

    // 提取唯一的小说ID
    const uniqueNovelIds = new Set(
      completedChapters.map((progress) => progress.chapter.novelId)
    )

    const booksReadCount = uniqueNovelIds.size

    return successResponse({
      booksRead: booksReadCount
    })
  } catch (error) {
    return handleApiError(error, 'Failed to fetch profile stats')
  }
}
