// src/app/api/admin/novels/[id]/ban/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { withAdminAuth } from '@/lib/admin-middleware'
import { invalidateNovelRelatedCache } from '@/lib/cache'

export const POST = withAdminAuth(async (
  session,
  request: Request,
  props: { params: Promise<{ id: string }> }
) => {
  try {
    const params = await props.params

    const novelId = parseInt(params.id)
    const { isBanned } = await request.json()

    // 🔄 添加数据库重试机制，解决连接超时问题
    // ⚡ 修复：获取 slug 和 category 用于清除缓存
    const novel = await withRetry(
      () => prisma.novel.update({
        where: { id: novelId },
        data: { isBanned },
        select: {
          id: true,
          title: true,
          slug: true,
          isBanned: true,
          category: {
            select: { slug: true }
          }
        }
      }),
      { operationName: 'Update novel ban status' }
    ) as any

    // ⚡ 清除缓存：封禁状态影响首页、分类页、小说详情的显示
    await invalidateNovelRelatedCache(novel.slug, novel.category?.slug)

    return NextResponse.json({
      success: true,
      novel: {
        id: novel.id,
        title: novel.title,
        isBanned: novel.isBanned
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update ban status' },
      { status: 500 }
    )
  }
})