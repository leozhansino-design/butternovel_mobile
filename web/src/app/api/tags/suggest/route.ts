// src/app/api/tags/suggest/route.ts
// Tags自动补全API

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-utils'

/**
 * GET /api/tags/suggest?q={query}
 * 返回匹配查询的标签建议列表
 *
 * Query参数:
 * - q: 搜索查询字符串
 * - limit: 返回结果数量（默认10，最大20）
 *
 * 响应:
 * [
 *   { "name": "romance", "slug": "romance", "count": 1523 },
 *   ...
 * ]
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limitParam = searchParams.get('limit')

    // 验证查询参数
    if (!query || query.trim().length === 0) {
      return NextResponse.json([])
    }

    if (query.length > 30) {
      return NextResponse.json(
        { error: 'Query too long (max 30 characters)' },
        { status: 400 }
      )
    }

    const limit = Math.min(parseInt(limitParam || '10'), 20)

    // 标准化查询（转小写）
    const normalizedQuery = query.trim().toLowerCase()

    // 搜索匹配的标签
    // 使用startsWith查询获取前缀匹配，按使用次数排序
    const tags = await withRetry(() =>
      prisma.tag.findMany({
        where: {
          name: {
            startsWith: normalizedQuery,
            mode: 'insensitive'
          }
        },
        select: {
          name: true,
          slug: true,
          count: true
        },
        orderBy: {
          count: 'desc' // 按使用频率降序
        },
        take: limit
      })
    )

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Failed to fetch tag suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tag suggestions' },
      { status: 500 }
    )
  }
}
