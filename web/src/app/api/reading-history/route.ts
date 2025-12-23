// src/app/api/reading-history/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  unauthorizedResponse,
  handleApiError
} from '@/lib/api-response'

// GET - Get user's reading history
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return unauthorizedResponse()
    }

    // Get reading history with novel details, ordered by last read time
    const history = await prisma.readingHistory.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            authorName: true,
            status: true,
            totalChapters: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        lastReadAt: 'desc'
      },
      take: 50 // Limit to most recent 50
    }) as any[]

    // Transform data for frontend, filtering out any invalid entries
    const novels = history
      .filter(item => item.novel && item.novel.category) // Filter out null novels/categories
      .map(item => ({
        id: item.novel.id,
        title: item.novel.title,
        slug: item.novel.slug,
        coverImage: item.novel.coverImage,
        authorName: item.novel.authorName,
        status: item.novel.status,
        totalChapters: item.novel.totalChapters,
        categoryName: item.novel.category.name,
        lastReadAt: item.lastReadAt.toISOString()
      }))

    return successResponse({ novels })
  } catch (error) {
    return handleApiError(error, 'Failed to fetch reading history')
  }
}
