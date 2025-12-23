// src/app/api/tags/popular/route.ts
// 获取热门标签API - 支持全站或特定分类的热门标签

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'

/**
 * GET /api/tags/popular?category=Romance&limit=15
 * 获取热门标签
 *
 * Query参数:
 * - category: 分类名称（可选，如：Romance, Fantasy）
 * - limit: 返回标签数量（默认15）
 *
 * 响应:
 * {
 *   "success": true,
 *   "data": [
 *     { "id": "xxx", "name": "CEO", "slug": "ceo", "count": 123 }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryParam = searchParams.get('genre') || searchParams.get('category')
    const limit = Math.min(parseInt(searchParams.get('limit') || '15'), 50)

    let tags: Array<{ id: string; name: string; slug: string; count: number }>

    if (categoryParam) {
      // 获取特定分类下的热门标签
      // 查找该分类下的所有小说，然后统计其标签
      const category = await withRetry(
        () => prisma.category.findFirst({
          where: {
            OR: [
              { slug: { equals: categoryParam, mode: 'insensitive' } },
              { name: { equals: categoryParam, mode: 'insensitive' } }
            ]
          },
          select: { id: true }
        }),
        { operationName: 'Find category by slug or name' }
      ) as { id: number } | null

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            error: `Category '${categoryParam}' not found`
          },
          { status: 404 }
        )
      }

      // 获取该分类下所有小说ID
      const novels = await withRetry(
        () => prisma.novel.findMany({
          where: {
            categoryId: category.id,
            isPublished: true,
            isBanned: false
          },
          select: { id: true }
        }),
        { operationName: 'Get novels by category' }
      ) as Array<{ id: number }>

      const novelIds = novels.map(n => n.id)

      if (novelIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: []
        })
      }

      // 获取这些小说关联的标签，并按使用频率排序
      const tagsWithCount = await withRetry(
        () => prisma.tag.findMany({
          where: {
            novels: {
              some: {
                id: { in: novelIds }
              }
            }
          },
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: {
                novels: {
                  where: {
                    id: { in: novelIds }
                  }
                }
              }
            }
          },
          orderBy: {
            count: 'desc'
          },
          take: limit
        }),
        { operationName: 'Get popular tags by category' }
      ) as Array<{
        id: string
        name: string
        slug: string
        _count: { novels: number }
      }>

      // 格式化响应
      tags = tagsWithCount.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        count: tag._count.novels
      }))
    } else {
      // 获取全站热门标签 - 使用实际关联的小说数量
      const tagsWithCount = await withRetry(
        () => prisma.tag.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: {
                novels: {
                  where: {
                    isPublished: true,
                    isBanned: false
                  }
                }
              }
            }
          },
          orderBy: {
            count: 'desc' // 先按存储的count排序以提高性能
          },
          take: limit * 3 // 多取一些，然后过滤掉没有小说的标签
        }),
        { operationName: 'Get popular tags' }
      ) as Array<{
        id: string
        name: string
        slug: string
        _count: { novels: number }
      }>

      // 过滤掉没有小说的标签，并按实际数量排序
      tags = tagsWithCount
        .filter(tag => tag._count.novels > 0) // 只返回有小说的标签
        .map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          count: tag._count.novels
        }))
        .sort((a, b) => b.count - a.count) // 按实际数量排序
        .slice(0, limit) // 限制返回数量
    }

    return NextResponse.json({
      success: true,
      data: tags
    })
  } catch (error) {
    console.error('Popular tags API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch popular tags',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
