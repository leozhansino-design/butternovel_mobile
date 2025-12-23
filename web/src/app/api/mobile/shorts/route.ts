import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 移动端 API: 获取短篇小说列表
 * GET /api/mobile/shorts
 *
 * Query params:
 * - page: 页码 (默认 1)
 * - limit: 每页数量 (默认 20, 最大 50)
 * - genre: 分类筛选
 * - sort: 排序方式 (popular | latest | recommended)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const genre = searchParams.get('genre')
    const sort = searchParams.get('sort') || 'popular'

    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {
      isShortNovel: true,
      isPublished: true,
      isBanned: false,
    }

    if (genre) {
      where.shortNovelGenre = genre
    }

    // 排序方式
    const orderBy: any = sort === 'latest'
      ? { createdAt: 'desc' }
      : sort === 'recommended'
      ? { likeCount: 'desc' }
      : { viewCount: 'desc' } // popular (default)

    // 并行查询
    const [shorts, total] = await Promise.all([
      prisma.novel.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          blurb: true,
          readingPreview: true,
          shortNovelGenre: true,
          wordCount: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          averageRating: true,
          authorId: true,
          authorName: true,
          createdAt: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.novel.count({ where }),
    ])

    // 转换为移动端友好的格式
    const stories = shorts.map(novel => ({
      id: novel.id.toString(),
      title: novel.title,
      slug: novel.slug,
      blurb: novel.blurb || '',
      readingPreview: novel.readingPreview,
      category: novel.shortNovelGenre || 'General',
      wordCount: novel.wordCount,
      readCount: novel.viewCount,
      likeCount: novel.likeCount,
      commentCount: novel.commentCount,
      averageRating: novel.averageRating,
      authorId: novel.authorId,
      authorName: novel.authorName,
      createdAt: novel.createdAt.toISOString(),
    }))

    return NextResponse.json({
      stories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    })
  } catch (error) {
    console.error('Mobile shorts API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shorts' },
      { status: 500 }
    )
  }
}
