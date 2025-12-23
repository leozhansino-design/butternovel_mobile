// src/app/api/library/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'

// GET - 获取用户书架
// 🔧 OPTIMIZATION: 移除Redis缓存,直接查询数据库
// 原因:
// - Library API无法使用ISR(每个用户数据不同)
// - 查询已优化,有索引,性能~100ms
// - 使用频率低(每用户每天~3次)
// - Supabase查询无限制,成本为0
// 100用户×3次 = 300次/天 (Supabase轻松应对)
export const GET = withErrorHandling(async () => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  console.log(`[Library] 📚 Fetching library for user: ${session.user.id}`)
  const startTime = Date.now()

  const libraryData = await prisma.$queryRaw<Array<{
    libraryId: string
    novelId: number
    novelTitle: string
    novelSlug: string
    coverImage: string
    categoryName: string
    status: string
    totalChapters: number
    addedAt: Date
    lastReadChapter: number | null
    lastReadChapterTitle: string | null
    readChapters: bigint
  }>>`
    SELECT
      l.id as "libraryId",
      n.id as "novelId",
      n.title as "novelTitle",
      n.slug as "novelSlug",
      n."coverImage",
      c.name as "categoryName",
      n.status,
      n."totalChapters",
      l."addedAt",
      rh_ch."chapterNumber" as "lastReadChapter",
      rh_ch.title as "lastReadChapterTitle",
      COALESCE(cp_count.count, 0) as "readChapters"
    FROM "Library" l
    INNER JOIN "Novel" n ON l."novelId" = n.id
    INNER JOIN "Category" c ON n."categoryId" = c.id
    LEFT JOIN LATERAL (
      SELECT "chapterId"
      FROM "ReadingHistory"
      WHERE "userId" = ${session.user.id} AND "novelId" = n.id
      LIMIT 1
    ) rh_sub ON true
    LEFT JOIN "Chapter" rh_ch ON rh_sub."chapterId" = rh_ch.id
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int as count
      FROM "ChapterProgress" cp
      INNER JOIN "Chapter" ch ON cp."chapterId" = ch.id
      WHERE cp."userId" = ${session.user.id} AND ch."novelId" = n.id
    ) cp_count ON true
    WHERE l."userId" = ${session.user.id}
    ORDER BY l."addedAt" DESC
  `

  // 转换为前端需要的格式
  const novels = libraryData.map((item: any) => ({
    id: item.novelId,
    title: item.novelTitle,
    slug: item.novelSlug,
    coverImage: item.coverImage,
    category: item.categoryName,
    status: item.status,
    totalChapters: item.totalChapters,
    addedAt: item.addedAt.toISOString(),
    lastReadChapter: item.lastReadChapter,
    lastReadChapterTitle: item.lastReadChapterTitle,
    readChapters: Number(item.readChapters)
  }))

  const duration = Date.now() - startTime
  console.log(`[Library] ✅ Loaded ${novels.length} novels (${duration}ms)`)

  return successResponse({ novels })
})

// POST - 添加到书架
export const POST = withErrorHandling(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const { novelId } = await request.json()

  if (!novelId) {
    return errorResponse('Novel ID required', 400, 'MISSING_NOVEL_ID')
  }

  // 检查用户是否存在
  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!userExists) {
    return errorResponse('User not found', 404, 'USER_NOT_FOUND')
  }

  // 检查是否已存在
  const existing = await prisma.library.findUnique({
    where: {
      userId_novelId: {
        userId: session.user.id,
        novelId: parseInt(novelId)
      }
    }
  })

  if (existing) {
    return successResponse({ message: 'Already in library' })
  }

  await prisma.library.create({
    data: {
      userId: session.user.id,
      novelId: parseInt(novelId)
    }
  })

  console.log(`[Library] ✅ Added novel ${novelId} to user ${session.user.id}'s library`)

  return successResponse({ message: 'Added to library' })
})

// DELETE - 从书架移除
export const DELETE = withErrorHandling(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const { novelId } = await request.json()

  if (!novelId) {
    return errorResponse('Novel ID required', 400, 'MISSING_NOVEL_ID')
  }

  // ✅ 使用 deleteMany 代替 delete (不会在记录不存在时抛出错误)
  const result = await prisma.library.deleteMany({
    where: {
      userId: session.user.id,
      novelId: parseInt(novelId)
    }
  })

  // 验证是否成功删除
  if (result.count === 0) {
    return errorResponse('Novel not in library', 404, 'NOT_IN_LIBRARY')
  }

  console.log(`[Library] ✅ Removed novel ${novelId} from user ${session.user.id}'s library`)

  return successResponse({ message: 'Removed from library' })
})