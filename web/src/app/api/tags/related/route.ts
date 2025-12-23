// src/app/api/tags/related/route.ts
// 获取相关标签API - 标签智能联动功能

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'

/**
 * GET /api/tags/related?tags=ceo,billionaire&category=Romance&limit=10
 * 获取与指定标签常一起出现的相关标签
 *
 * Query参数:
 * - tags: 已选标签的slug（逗号分隔，必填）
 * - category: 分类名称（可选）
 * - limit: 返回标签数量（默认10）
 *
 * 响应:
 * {
 *   "success": true,
 *   "data": [
 *     { "id": "xxx", "name": "Contract Marriage", "slug": "contract-marriage", "coOccurrence": 89 }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tagsParam = searchParams.get('tags')
    const categoryName = searchParams.get('genre') || searchParams.get('category')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    if (!tagsParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parameter "tags" is required'
        },
        { status: 400 }
      )
    }

    const tagSlugs = tagsParam.split(',').map(t => t.trim()).filter(Boolean)

    if (tagSlugs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one tag is required'
        },
        { status: 400 }
      )
    }

    // 查找所有选中的标签
    const selectedTags = await withRetry(
      () => prisma.tag.findMany({
        where: {
          slug: { in: tagSlugs }
        },
        select: {
          id: true,
          slug: true
        }
      }),
      { operationName: 'Find selected tags' }
    ) as Array<{ id: string; slug: string }>

    if (selectedTags.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'None of the specified tags were found'
        },
        { status: 404 }
      )
    }

    const selectedTagIds = selectedTags.map(t => t.id)

    // 构建where条件
    const novelWhere: any = {
      isPublished: true,
      isBanned: false,
      // 小说必须包含所有选中的标签
      AND: selectedTagIds.map(tagId => ({
        tags: {
          some: {
            id: tagId
          }
        }
      }))
    }

    // 如果指定了分类，添加分类筛选
    if (categoryName) {
      const category = await withRetry(
        () => prisma.category.findFirst({
          where: {
            OR: [
              { slug: { equals: categoryName, mode: 'insensitive' } },
              { name: { equals: categoryName, mode: 'insensitive' } }
            ]
          },
          select: { id: true }
        }),
        { operationName: 'Find category by slug or name' }
      ) as { id: number } | null

      if (category) {
        novelWhere.categoryId = category.id
      }
    }

    // 查找包含所有选中标签的小说
    const novels = await withRetry(
      () => prisma.novel.findMany({
        where: novelWhere,
        select: {
          id: true
        }
      }),
      { operationName: 'Find novels with selected tags' }
    ) as Array<{ id: number }>

    const novelIds = novels.map(n => n.id)

    if (novelIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // 查找这些小说中常一起出现的其他标签
    // 排除已选中的标签
    const relatedTags = await withRetry(
      () => prisma.tag.findMany({
        where: {
          novels: {
            some: {
              id: { in: novelIds }
            }
          },
          id: {
            notIn: selectedTagIds
          }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          novels: {
            where: {
              id: { in: novelIds }
            },
            select: {
              id: true
            }
          }
        },
        take: limit * 2 // 取更多，然后按共现次数排序
      }),
      { operationName: 'Find related tags' }
    ) as Array<{
      id: string
      name: string
      slug: string
      novels: Array<{ id: number }>
    }>

    // 计算共现次数并排序
    const relatedTagsWithCount = relatedTags
      .map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        coOccurrence: tag.novels.length
      }))
      .sort((a, b) => b.coOccurrence - a.coOccurrence)
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: relatedTagsWithCount
    })
  } catch (error) {
    console.error('Related tags API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch related tags',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
