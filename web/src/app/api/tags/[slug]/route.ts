// src/app/api/tags/[slug]/route.ts
// Tags搜索API - 支持单个或多个标签筛选

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-utils'
import { calculateHotScore } from '@/lib/tags'
import { Prisma } from '@prisma/client'

const PAGE_SIZE = 24 // 每页24本小说

/**
 * GET /api/tags/[slug]?tags=tag2,tag3&sort=hot&page=1
 * 搜索带特定tags的小说
 *
 * Query参数:
 * - tags: 额外的tag slugs（逗号分隔）
 * - sort: 排序方式 (hot|bookmarks|views) 默认hot
 * - page: 页码（从1开始）默认1
 *
 * 响应:
 * {
 *   "novels": [...],
 *   "relatedTags": [{ "name": "england", "slug": "england", "count": 89 }],
 *   "total": 1500,
 *   "page": 1,
 *   "pageSize": 24,
 *   "totalPages": 63
 * }
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const searchParams = request.nextUrl.searchParams

    // 获取查询参数
    const additionalTagsParam = searchParams.get('tags') || ''
    const sort = searchParams.get('sort') || 'hot'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))

    // 验证排序参数
    if (!['hot', 'bookmarks', 'views'].includes(sort)) {
      return NextResponse.json(
        { error: 'Invalid sort parameter. Must be: hot, bookmarks, or views' },
        { status: 400 }
      )
    }

    // 解析所有tags（主slug + 额外tags）
    const additionalTags = additionalTagsParam
      ? additionalTagsParam.split(',').map(t => t.trim()).filter(Boolean)
      : []
    const allTagSlugs = [slug, ...additionalTags]

    // 查找所有tag记录
    const tagRecords = await withRetry(() =>
      prisma.tag.findMany({
        where: {
          slug: { in: allTagSlugs }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          count: true
        }
      })
    ) as Array<{ id: string; name: string; slug: string; count: number }>

    // 验证所有tags都存在
    if (tagRecords.length !== allTagSlugs.length) {
      const foundSlugs = tagRecords.map(t => t.slug)
      const notFound = allTagSlugs.filter(s => !foundSlugs.includes(s))
      return NextResponse.json(
        { error: `Tags not found: ${notFound.join(', ')}` },
        { status: 404 }
      )
    }

    const tagIds = tagRecords.map(t => t.id)

    // 构建排序条件
    type OrderByOption = { hotScore: 'desc' } | { bookmarkCount: 'desc' } | { viewCount: 'desc' }
    let orderBy: OrderByOption
    switch (sort) {
      case 'hot':
        orderBy = { hotScore: 'desc' }
        break
      case 'bookmarks':
        orderBy = { bookmarkCount: 'desc' }
        break
      case 'views':
        orderBy = { viewCount: 'desc' }
        break
      default:
        orderBy = { hotScore: 'desc' }
    }

    // 查询小说
    // 使用嵌套的many-to-many关系查询
    const [novels, totalCount] = await Promise.all([
      withRetry(() =>
        prisma.novel.findMany({
          where: {
            AND: [
              { isPublished: true },
              { isBanned: false },
              // 小说必须包含所有指定的tags
              ...tagIds.map(tagId => ({
                tags: {
                  some: {
                    id: tagId
                  }
                }
              }))
            ]
          },
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            blurb: true,
            authorName: true,
            viewCount: true,
            bookmarkCount: true,
            totalChapters: true,
            status: true,
            hotScore: true,
            averageRating: true,
            totalRatings: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            tags: {
              select: {
                id: true,
                name: true,
                slug: true
              },
              take: 5 // 只返回前5个tags
            }
          },
          orderBy,
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE
        })
      ) as Promise<Array<any>>,
      // 获取总数
      withRetry(() =>
        prisma.novel.count({
          where: {
            AND: [
              { isPublished: true },
              { isBanned: false },
              ...tagIds.map(tagId => ({
                tags: {
                  some: {
                    id: tagId
                  }
                }
              }))
            ]
          }
        })
      ) as Promise<number>
    ])

    // 计算相关tags（Refine by tag）
    // 查询与当前小说共现的其他tags
    const relatedTags = await withRetry(async () => {
      // 获取所有包含当前tags的小说的IDs
      const novelIds = novels.map(n => n.id)

      if (novelIds.length === 0) {
        return []
      }

      // 使用Prisma聚合查询获取共现tags
      // 这种方法更安全且不需要原生SQL
      const tags = await prisma.tag.findMany({
        where: {
          novels: {
            some: {
              id: { in: novelIds }
            }
          },
          id: {
            notIn: tagIds
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
        orderBy: {
          count: 'desc'  // 按使用频率降序
        },
        take: 20
      })

      return tags.map((tag: { id: string; name: string; slug: string; novels: Array<{ id: number }> }) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        count: tag.novels.length  // 共现次数
      }))
    })

    const totalPages = Math.ceil(totalCount / PAGE_SIZE)

    return NextResponse.json({
      novels,
      relatedTags,
      selectedTags: tagRecords,
      total: totalCount,
      page,
      pageSize: PAGE_SIZE,
      totalPages,
      sort
    })
  } catch (error) {
    console.error('Failed to search novels by tags:', error)
    return NextResponse.json(
      { error: 'Failed to search novels' },
      { status: 500 }
    )
  }
}
