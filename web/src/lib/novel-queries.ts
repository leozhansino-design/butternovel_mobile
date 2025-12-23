// src/lib/novel-queries.ts
// 📚 统一的数据库查询工具函数

import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'

// ============================================
// Novel (小说) 查询
// ============================================

/**
 * 根据 ID 获取小说
 */
export async function getNovelById(
  novelId: number,
  options?: {
    includeChapters?: boolean
    includeCategory?: boolean
    includeStats?: boolean
  }
) {
  return withRetry(
    () => prisma.novel.findUnique({
      where: { id: novelId },
      include: {
        category: options?.includeCategory ?? true,
        chapters: options?.includeChapters
          ? {
              select: {
                id: true,
                chapterNumber: true,
                title: true,
                wordCount: true,
                isPublished: true,
                createdAt: true
              },
              orderBy: { chapterNumber: 'asc' }
            }
          : false,
        ...(options?.includeStats && {
          _count: {
            select: {
              chapters: true,
              likes: true,
              comments: true,
              views: true,
              ratings: true
            }
          }
        })
      }
    }),
    { operationName: 'Get novel by ID' }
  )
}

/**
 * 根据 Slug 获取小说
 */
export async function getNovelBySlug(
  slug: string,
  options?: {
    includeChapters?: boolean
    includeCategory?: boolean
  }
) {
  return withRetry(
    () => prisma.novel.findUnique({
      where: { slug },
      include: {
        category: options?.includeCategory ?? true,
        chapters: options?.includeChapters
          ? {
              select: {
                id: true,
                chapterNumber: true,
                title: true,
                isPublished: true
              },
              where: { isPublished: true },
              orderBy: { chapterNumber: 'asc' }
            }
          : false
      }
    }),
    { operationName: 'Get novel by slug' }
  )
}

/**
 * 验证小说存在且已发布
 */
export async function validateNovelPublished(novelId: number) {
  const novel = await withRetry(
    () => prisma.novel.findUnique({
      where: { id: novelId },
      select: {
        id: true,
        isPublished: true,
        isBanned: true
      }
    }),
    { operationName: 'Validate novel' }
  ) as any

  if (!novel) {
    throw new Error('Novel not found')
  }

  if (!novel.isPublished || novel.isBanned) {
    throw new Error('Novel is not available')
  }

  return novel
}

// ============================================
// Chapter (章节) 查询
// ============================================

/**
 * 根据 ID 获取章节
 */
export async function getChapterById(chapterId: number) {
  return withRetry(
    () => prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            slug: true,
            authorId: true,
            isPublished: true,
            isBanned: true
          }
        }
      }
    }),
    { operationName: 'Get chapter by ID' }
  ) as any
}

/**
 * 获取小说的章节列表
 */
export async function getChaptersByNovelId(
  novelId: number,
  options?: {
    publishedOnly?: boolean
    limit?: number
    offset?: number
  }
) {
  return withRetry(
    () => prisma.chapter.findMany({
      where: {
        novelId,
        ...(options?.publishedOnly && { isPublished: true })
      },
      select: {
        id: true,
        chapterNumber: true,
        title: true,
        wordCount: true,
        isPublished: true,
        createdAt: true
      },
      orderBy: { chapterNumber: 'asc' },
      ...(options?.limit && { take: options.limit }),
      ...(options?.offset && { skip: options.offset })
    }),
    { operationName: 'Get chapters by novel ID' }
  )
}

/**
 * 验证章节属于指定小说
 */
export async function validateChapterBelongsToNovel(
  chapterId: number,
  novelId: number
) {
  const chapter = await getChapterById(chapterId)

  if (!chapter) {
    throw new Error('Chapter not found')
  }

  if (chapter.novel.id !== novelId) {
    throw new Error('Chapter does not belong to this novel')
  }

  if (!chapter.novel.isPublished || chapter.novel.isBanned) {
    throw new Error('Novel is not available')
  }

  return chapter
}

// ============================================
// Admin Profile (管理员资料) 查询
// ============================================

/**
 * 获取或创建管理员资料
 */
export async function getOrCreateAdminProfile(email: string) {
  return withRetry(
    () => prisma.adminProfile.upsert({
      where: { email },
      create: {
        email,
        displayName: 'Admin',
        bio: '',
        avatar: null,
      },
      update: {}
    }),
    { operationName: 'Get or create admin profile' }
  )
}

// ============================================
// Category (分类) 查询
// ============================================

/**
 * 获取所有分类
 */
export async function getAllCategories() {
  return withRetry(
    () => prisma.category.findMany({
      orderBy: { order: 'asc' }
    }),
    { operationName: 'Get all categories' }
  )
}

/**
 * 验证分类存在
 */
export async function validateCategoryExists(categoryId: number) {
  const category = await withRetry(
    () => prisma.category.findUnique({
      where: { id: categoryId }
    }),
    { operationName: 'Validate category' }
  )

  if (!category) {
    throw new Error('Category not found')
  }

  return category
}

// ============================================
// User (用户) 查询
// ============================================

/**
 * 根据 ID 获取用户
 */
export async function getUserById(userId: string) {
  return withRetry(
    () => prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        isActive: true,
        isBanned: true
      }
    }),
    { operationName: 'Get user by ID' }
  ) as any
}

/**
 * 验证用户存在且活跃
 */
export async function validateUserActive(userId: string) {
  const user = await getUserById(userId)

  if (!user) {
    throw new Error('User not found')
  }

  if (!user.isActive || user.isBanned) {
    throw new Error('User account is not active')
  }

  return user
}

// ============================================
// 统计查询
// ============================================

/**
 * 获取小说统计信息
 */
export async function getNovelStats(novelId: number) {
  return withRetry(
    () => prisma.novel.findUnique({
      where: { id: novelId },
      select: {
        id: true,
        title: true,
        totalChapters: true,
        wordCount: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        averageRating: true,
        totalRatings: true,
        _count: {
          select: {
            chapters: true,
            likes: true,
            comments: true,
            views: true,
            ratings: true
          }
        }
      }
    }),
    { operationName: 'Get novel stats' }
  )
}

// ============================================
// 标题重复检查
// ============================================

/**
 * 检查小说标题是否已存在（完全匹配，不区分大小写）
 * @param title 要检查的标题
 * @param excludeNovelId 排除的小说ID（用于更新时排除自身）
 * @returns 如果标题已存在返回 true，否则返回 false
 */
export async function checkNovelTitleExists(
  title: string,
  excludeNovelId?: number
): Promise<boolean> {
  const normalizedTitle = title.trim()

  const existingNovel = await withRetry(
    () => prisma.novel.findFirst({
      where: {
        title: {
          equals: normalizedTitle,
          mode: 'insensitive'  // 不区分大小写
        },
        ...(excludeNovelId !== undefined && {
          NOT: { id: excludeNovelId }
        })
      },
      select: { id: true }
    }),
    { operationName: 'Check novel title exists' }
  )

  return existingNovel !== null
}

/**
 * 验证小说标题唯一性
 * @param title 要验证的标题
 * @param excludeNovelId 排除的小说ID（用于更新时排除自身）
 * @throws Error 如果标题已存在
 */
export async function validateNovelTitleUnique(
  title: string,
  excludeNovelId?: number
): Promise<void> {
  const exists = await checkNovelTitleExists(title, excludeNovelId)

  if (exists) {
    throw new Error('A novel with this title already exists')
  }
}

// ============================================
// 类型守卫和断言函数
// ============================================

/**
 * 断言小说存在
 */
export function assertNovelExists<T>(novel: T | null): asserts novel is T {
  if (!novel) {
    throw new Error('Novel not found')
  }
}

/**
 * 断言章节存在
 */
export function assertChapterExists<T>(chapter: T | null): asserts chapter is T {
  if (!chapter) {
    throw new Error('Chapter not found')
  }
}

/**
 * 断言用户存在
 */
export function assertUserExists<T>(user: T | null): asserts user is T {
  if (!user) {
    throw new Error('User not found')
  }
}
