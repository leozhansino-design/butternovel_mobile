import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { rateLimit, getIdentifier } from '@/lib/rate-limit'
import { SHORT_NOVEL_GENRES } from '@/lib/short-novel'

/**
 * 计算质量分数（贝叶斯平均）
 * 参考IMDb和豆瓣的算法，考虑评分数量的可信度
 */
function calculateQualityScore(averageRating: number | null, totalRatings: number): number {
  if (!averageRating || totalRatings === 0) return 0

  // 最小评分数阈值（低于此数量的评分可信度降低）
  const minRatings = 10

  // 假设的全站平均评分（可以从数据库统计，这里使用经验值）
  const globalAverage = 7.0

  // 贝叶斯加权评分：(v / (v + m)) * R + (m / (v + m)) * C
  // v = 该小说的评分数, m = 最小评分阈值, R = 该小说平均分, C = 全站平均分
  const weightedRating =
    (totalRatings / (totalRatings + minRatings)) * averageRating +
    (minRatings / (totalRatings + minRatings)) * globalAverage

  // 归一化到0-100分
  return (weightedRating / 10) * 100
}

/**
 * 计算热度分数
 * 综合考虑浏览量、收藏数、点赞数、评论数
 */
function calculateHotScore(novel: any): number {
  // 各指标权重（基于行业经验）
  const viewWeight = 0.3       // 浏览量权重30%
  const bookmarkWeight = 2.5   // 收藏权重最高（强意愿指标）
  const likeWeight = 1.0       // 点赞权重
  const commentWeight = 1.5    // 评论权重（互动指标）

  const viewCount = novel.viewCount || 0
  const bookmarkCount = novel.bookmarkCount || 0
  const likeCount = novel.likeCount || 0
  const commentCount = novel.commentCount || 0

  // 使用对数缩放避免大数字主导（Reddit/HN常用技巧）
  const viewScore = Math.log10(viewCount + 1) * viewWeight
  const bookmarkScore = Math.log10(bookmarkCount + 1) * bookmarkWeight
  const likeScore = Math.log10(likeCount + 1) * likeWeight
  const commentScore = Math.log10(commentCount + 1) * commentWeight

  return viewScore + bookmarkScore + likeScore + commentScore
}

/**
 * 计算搜索相关性分数
 * 综合考虑：文本匹配度 + 内容质量 + 热度
 */
function calculateRelevanceScore(novel: any, query: string): number {
  const normalizedQuery = query.toLowerCase().trim()
  const title = novel.title.toLowerCase()
  const authorName = novel.authorName.toLowerCase()
  const blurb = novel.blurb.toLowerCase()

  // 去除空格版本（支持 "thetruth" 搜索 "the truth switch"）
  const titleNoSpaces = title.replace(/\s+/g, '')
  const queryNoSpaces = normalizedQuery.replace(/\s+/g, '')

  let matchScore = 0

  // === 1. 文本匹配分数（1000分制） ===
  // 标题精确匹配（最高优先级）
  if (title === normalizedQuery) {
    matchScore += 1000
  }
  // 标题以查询开头（高优先级）
  else if (title.startsWith(normalizedQuery)) {
    matchScore += 800
  }
  // 无空格版本精确匹配
  else if (titleNoSpaces === queryNoSpaces) {
    matchScore += 700
  }
  // 无空格版本前缀匹配
  else if (titleNoSpaces.startsWith(queryNoSpaces)) {
    matchScore += 600
  }
  // 标题包含查询
  else if (title.includes(normalizedQuery)) {
    matchScore += 500
    // 如果匹配在词首，额外加分
    const words = title.split(/\s+/)
    if (words.some((word: string) => word.startsWith(normalizedQuery))) {
      matchScore += 200
    }
  }
  // 作者名匹配
  else if (authorName.includes(normalizedQuery)) {
    matchScore += 100
  }
  // 简介匹配
  else if (blurb.includes(normalizedQuery)) {
    matchScore += 50
  }

  // 标题越短，相关性越高（同等匹配下）
  matchScore -= title.length * 0.1

  // === 2. 质量分数（0-100分） ===
  const qualityScore = calculateQualityScore(
    novel.averageRating,
    novel.totalRatings
  )

  // === 3. 热度分数（动态范围） ===
  const hotScore = calculateHotScore(novel)

  // === 4. 综合评分 ===
  // 匹配度占主导（70%），质量和热度作为加成（30%）
  const finalScore = matchScore * 0.7 + qualityScore * 0.2 + hotScore * 0.1

  return finalScore
}

// GET /api/search?q=keyword&category=1&tags=ceo,billionaire&status=completed,ongoing&sort=hot&page=1&limit=20
export async function GET(request: Request) {
  try {
    // 速率限制：防止滥用搜索功能
    const identifier = getIdentifier(request)
    const { success, limit: rateLimitMax, remaining, reset } = rateLimit(identifier, 'search')

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitMax.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('genre') || searchParams.get('category') // 支持 genre 或 category
    const tagsParam = searchParams.get('tags')
    const statusParam = searchParams.get('status')
    const sortParam = searchParams.get('sort') || 'hot'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // 最大50条
    const typeParam = searchParams.get('type') || 'novels' // 'novels' or 'shorts'

    // 构建搜索条件
    const where: any = {
      isPublished: true, // 只搜索已发布的小说
      isBanned: false,   // 排除被禁用的小说
    }

    // Filter by type (novels or shorts)
    if (typeParam === 'shorts') {
      where.isShortNovel = true
    } else {
      where.isShortNovel = false
    }

    // 搜索关键词（标题、作者名、简介）
    if (query.trim()) {
      where.OR = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { authorName: { contains: query.trim(), mode: 'insensitive' } },
        { blurb: { contains: query.trim(), mode: 'insensitive' } },
      ]
    }

    // 分类筛选（支持分类 slug、名称或ID）
    if (category) {
      if (typeParam === 'shorts') {
        // For shorts, filter by shortNovelGenre (using slug)
        const genre = SHORT_NOVEL_GENRES.find(
          g => g.slug === category || g.id === category || g.name.toLowerCase() === category.toLowerCase()
        )
        if (genre) {
          where.shortNovelGenre = genre.id
        } else {
          // Genre not found, ensure no results
          where.shortNovelGenre = 'invalid-genre'
        }
      } else {
        // For regular novels, filter by category
        // 检查是否为数字ID
        if (/^\d+$/.test(category)) {
          where.categoryId = parseInt(category)
        } else {
          // 优先按 slug 查找，如果找不到再按名称查找
          const categoryRecord = await withRetry(
            () => prisma.category.findFirst({
              where: {
                OR: [
                  { slug: { equals: category, mode: 'insensitive' } },
                  { name: { equals: category, mode: 'insensitive' } }
                ]
              },
              select: { id: true }
            }),
            { operationName: 'Find category by slug or name' }
          ) as { id: number } | null
          if (categoryRecord) {
            where.categoryId = categoryRecord.id
          } else {
            // 分类不存在，设置不可能的ID确保返回空结果
            where.categoryId = -1
          }
        }
      }
    }

    // 标签筛选（多标签AND逻辑）
    if (tagsParam) {
      const tagSlugs = tagsParam.split(',').map(t => t.trim()).filter(Boolean)
      if (tagSlugs.length > 0) {
        // 查找标签记录
        const tagRecords = await withRetry(
          () => prisma.tag.findMany({
            where: { slug: { in: tagSlugs } },
            select: { id: true }
          }),
          { operationName: 'Find tags by slugs' }
        ) as Array<{ id: string }>

        if (tagRecords.length > 0) {
          const tagIds = tagRecords.map(t => t.id)
          // 小说必须包含所有选中的标签
          if (!where.AND) where.AND = []
          where.AND.push(
            ...tagIds.map(tagId => ({
              tags: {
                some: {
                  id: tagId
                }
              }
            }))
          )
        }
      }
    }

    // 状态筛选（多选）
    if (statusParam) {
      const statuses = statusParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
      if (statuses.length > 0) {
        // 验证状态值
        const validStatuses = statuses.filter(s => ['COMPLETED', 'ONGOING'].includes(s))
        if (validStatuses.length > 0) {
          where.status = { in: validStatuses }
        }
      }
    }

    // 如果有搜索关键词，获取更多结果以便排序（不分页）
    // 否则按指定排序方式排序并分页
    const shouldRankByRelevance = query.trim().length > 0

    // 确定排序方式
    let orderBy: any = []
    if (!shouldRankByRelevance) {
      switch (sortParam) {
        case 'hot':
          // 热度 = hotScore 或 综合评分
          orderBy = [
            { hotScore: 'desc' },
            { viewCount: 'desc' }
          ]
          break
        case 'new':
          // 最新
          orderBy = [{ createdAt: 'desc' }]
          break
        case 'top_rated':
          // 高评分
          orderBy = [
            { averageRating: 'desc' },
            { totalRatings: 'desc' }
          ]
          break
        case 'most_read':
          // 最多阅读
          orderBy = [{ viewCount: 'desc' }]
          break
        default:
          // 默认按热度
          orderBy = [
            { hotScore: 'desc' },
            { viewCount: 'desc' }
          ]
      }
    }

    let novels: any[] = []
    let total = 0

    // 基础查询选项
    const selectOptions = {
      id: true,
      title: true,
      slug: true,
      blurb: true,
      coverImage: true,
      authorName: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      // Short novel fields
      isShortNovel: true,
      shortNovelGenre: true,
      // 热度相关字段
      viewCount: true,
      likeCount: true,
      bookmarkCount: true,
      commentCount: true,
      averageRating: true,
      totalRatings: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      tags: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
        take: 5, // 只返回前5个标签用于显示
      },
      _count: {
        select: {
          chapters: {
            where: { isPublished: true },
          },
          likes: true,
          tags: true, // 添加tags总数统计
        },
      },
    }

    if (shouldRankByRelevance) {
      // 获取所有匹配结果（限制最多200条以避免性能问题）
      const allResults = await withRetry(
        () => prisma.novel.findMany({
          where,
          select: selectOptions,
          take: 200, // 限制最大查询量
        }),
        { operationName: 'Search novels' }
      ) as any[]

      // 计算相关性分数并排序
      const rankedResults = allResults
        .map(novel => ({
          ...novel,
          relevanceScore: calculateRelevanceScore(novel, query.trim()),
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)

      total = rankedResults.length

      // 手动分页
      const startIndex = (page - 1) * limit
      novels = rankedResults.slice(startIndex, startIndex + limit)
    } else {
      // 按指定排序方式查询
      const [allNovels, count] = await Promise.all([
        withRetry(
          () => prisma.novel.findMany({
            where,
            select: selectOptions,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
          }),
          { operationName: 'Get novels' }
        ) as Promise<any[]>,
        withRetry(
          () => prisma.novel.count({ where }),
          { operationName: 'Count novels' }
        ) as Promise<number>,
      ])

      novels = allNovels
      total = count
    }

    // 格式化结果
    const formattedNovels = novels.map((novel) => {
      // For short novels, get genre info from SHORT_NOVEL_GENRES
      let category = novel.category
      if (novel.isShortNovel && novel.shortNovelGenre) {
        const genre = SHORT_NOVEL_GENRES.find(g => g.id === novel.shortNovelGenre)
        if (genre) {
          category = { id: novel.shortNovelGenre, name: genre.name, slug: novel.shortNovelGenre }
        }
      }

      return {
        id: novel.id,
        title: novel.title,
        slug: novel.slug,
        blurb: novel.blurb,
        coverImage: novel.coverImage,
        authorName: novel.authorName,
        status: novel.status,
        createdAt: novel.createdAt,
        updatedAt: novel.updatedAt,
        viewCount: novel.viewCount,
        averageRating: novel.averageRating,
        totalRatings: novel.totalRatings,
        category,
        tags: novel.tags || [],
        tagsCount: novel._count.tags,
        chaptersCount: novel._count.chapters,
        likesCount: novel._count.likes,
        isShortNovel: novel.isShortNovel || false,
        shortNovelGenre: novel.shortNovelGenre,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        novels: formattedNovels,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
        query: query.trim() || null,
        category: category || null,
        tags: tagsParam || null,
        status: statusParam || null,
        sort: sortParam,
      },
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search novels',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
