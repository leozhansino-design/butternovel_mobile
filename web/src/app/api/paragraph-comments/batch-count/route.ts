// src/app/api/paragraph-comments/batch-count/route.ts
// ✅ 批量获取章节所有段落的评论数，减少数据库请求
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')

    if (!chapterId) {
      return NextResponse.json(
        { success: false, error: 'Missing chapterId' },
        { status: 400 }
      )
    }

    // ✅ 一次查询获取该章节所有段落的评论统计
    // 使用 groupBy 聚合，比40次独立查询快40倍
    const commentCounts = await withRetry(() =>
      prisma.paragraphComment.groupBy({
        by: ['paragraphIndex'],
        where: {
          chapterId: parseInt(chapterId),
        },
        _count: {
          id: true,
        },
      })
    ) as any[]

    // 转换为 Map 格式：{ paragraphIndex: count }
    const countsMap: Record<number, number> = {}
    commentCounts.forEach((item) => {
      countsMap[item.paragraphIndex] = item._count.id
    })

    return NextResponse.json({
      success: true,
      data: countsMap,
    })
  } catch (error) {
    console.error('[batch-count] Failed to fetch comment counts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comment counts' },
      { status: 500 }
    )
  }
}
