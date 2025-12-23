// src/app/api/novels/[id]/tags/route.ts
// 更新小说标签API

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-utils'
import { normalizeTags, validateTags, TAG_LIMITS } from '@/lib/tags'
import { invalidateNovelCache } from '@/lib/cache'
import { getAdminSession } from '@/lib/admin-auth'
import { Prisma } from '@prisma/client'

/**
 * PUT /api/novels/[id]/tags
 * 更新小说的标签
 *
 * 请求体:
 * {
 *   "tags": ["romance", "love", "british"]
 * }
 *
 * 权限:
 * - 小说作者
 * - 管理员
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const novelId = parseInt(id)

    if (isNaN(novelId)) {
      return NextResponse.json(
        { error: 'Invalid novel ID' },
        { status: 400 }
      )
    }

    // 身份验证：用户或管理员
    const session = await auth()
    const adminSession = await getAdminSession()

    if (!session?.user?.id && !adminSession) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tags = [] } = body

    // 验证tags是数组
    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Tags must be an array' },
        { status: 400 }
      )
    }

    // 标准化和验证tags
    const normalizedTags = normalizeTags(tags)
    const validation = validateTags(normalizedTags)

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // 检查小说是否存在
    const novel = await withRetry(() =>
      prisma.novel.findUnique({
        where: { id: novelId },
        select: {
          id: true,
          slug: true,
          authorId: true,
          tags: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      })
    ) as {
      id: number
      slug: string
      authorId: string
      tags: Array<{ id: string; name: string; slug: string }>
    } | null

    if (!novel) {
      return NextResponse.json(
        { error: 'Novel not found' },
        { status: 404 }
      )
    }

    // 权限检查：必须是作者或管理员
    const isAuthor = session?.user?.id === novel.authorId
    const isAdmin = !!adminSession

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - You can only edit your own novels' },
        { status: 403 }
      )
    }

    // 准备tags更新
    // 1. 找出要删除的tags（在旧列表中但不在新列表中）
    const oldTagNames = novel.tags.map(t => t.name)
    const tagsToRemove = oldTagNames.filter(name => !normalizedTags.includes(name))

    // 2. 找出要添加的tags（在新列表中但不在旧列表中）
    const tagsToAdd = normalizedTags.filter(name => !oldTagNames.includes(name))

    // 执行数据库事务
    await withRetry(() =>
      prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 为要添加的tags创建或查找Tag记录
        const tagRecords = await Promise.all(
          normalizedTags.map(async (tagName) => {
            // 使用upsert创建或更新tag
            return tx.tag.upsert({
              where: { name: tagName },
              create: {
                name: tagName,
                slug: tagName,
                count: 1
              },
              update: {
                // 如果tag是新添加的，增加count；否则不变
                count: tagsToAdd.includes(tagName)
                  ? { increment: 1 }
                  : undefined
              }
            })
          })
        )

        // 减少被移除tags的count
        if (tagsToRemove.length > 0) {
          await tx.tag.updateMany({
            where: {
              name: { in: tagsToRemove }
            },
            data: {
              count: { decrement: 1 }
            }
          })
        }

        // 更新Novel的tags关联
        await tx.novel.update({
          where: { id: novelId },
          data: {
            tags: {
              set: tagRecords.map(tag => ({ id: tag.id }))
            }
          }
        })
      })
    )

    // 清除缓存
    await invalidateNovelCache(novel.slug)

    // 获取更新后的tags
    const updatedNovel = await withRetry(() =>
      prisma.novel.findUnique({
        where: { id: novelId },
        select: {
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
              count: true
            }
          }
        }
      })
    ) as {
      tags: Array<{ id: string; name: string; slug: string; count: number }>
    } | null

    return NextResponse.json({
      success: true,
      tags: updatedNovel?.tags || []
    })
  } catch (error) {
    console.error('Failed to update novel tags:', error)
    return NextResponse.json(
      { error: 'Failed to update tags' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/novels/[id]/tags
 * 获取小说的标签列表
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const novelId = parseInt(id)

    if (isNaN(novelId)) {
      return NextResponse.json(
        { error: 'Invalid novel ID' },
        { status: 400 }
      )
    }

    const novel = await withRetry(() =>
      prisma.novel.findUnique({
        where: { id: novelId },
        select: {
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
              count: true
            }
          }
        }
      })
    ) as {
      tags: Array<{ id: string; name: string; slug: string; count: number }>
    } | null

    if (!novel) {
      return NextResponse.json(
        { error: 'Novel not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      tags: novel.tags
    })
  } catch (error) {
    console.error('Failed to fetch novel tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}
