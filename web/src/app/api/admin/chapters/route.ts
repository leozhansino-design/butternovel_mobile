// src/app/api/admin/chapters/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { withAdminAuth } from '@/lib/admin-middleware'
import { validateWithSchema, chapterCreateSchema } from '@/lib/validators'
import { invalidateNovelCache } from '@/lib/cache'

export const POST = withAdminAuth(async (session, request: Request) => {
  try {
    const body = await request.json()

    // ✅ 使用 Zod 验证
    const validation = validateWithSchema(chapterCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const { novelId, title, content, chapterNumber, isPublished } = validation.data
    const wordCount = body.wordCount

    // 🔄 添加数据库重试机制，解决连接超时问题
    const novel = await withRetry(
      () => prisma.novel.findUnique({
        where: { id: novelId },
        select: { id: true, slug: true, totalChapters: true, wordCount: true }
      }),
      { operationName: 'Get novel for new chapter' }
    ) as any

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    const slug = `chapter-${chapterNumber}`

    // ⭐ FIX: 计算字符数（中英文通用）
    const calculatedWordCount = wordCount !== undefined
      ? wordCount
      : content.trim().length

    // 🔄 添加数据库重试机制，解决连接超时问题
    const chapter = await withRetry(
      () => prisma.chapter.create({
        data: {
          novelId,
          title,
          slug,
          content,
          chapterNumber,
          wordCount: calculatedWordCount,
          isPublished: isPublished !== undefined ? isPublished : true,
        }
      }),
      { operationName: 'Create chapter' }
    ) as any

    // 🔄 添加数据库重试机制，解决连接超时问题
    await withRetry(
      () => prisma.novel.update({
        where: { id: novelId },
        data: {
          totalChapters: novel.totalChapters + 1,
          wordCount: novel.wordCount + chapter.wordCount,
        }
      }),
      { operationName: 'Update novel after chapter creation' }
    )

    // ⚡ 清除该小说的缓存（新章节发布）
    await invalidateNovelCache(novel.slug)

    return NextResponse.json({
      success: true,
      chapter: { id: chapter.id, title: chapter.title, chapterNumber: chapter.chapterNumber }
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create chapter' }, { status: 500 })
  }
})