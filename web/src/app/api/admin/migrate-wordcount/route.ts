// src/app/api/admin/migrate-wordcount/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { withAdminAuth } from '@/lib/admin-middleware'

/**
 * 迁移脚本：修复所有章节的 wordCount
 *
 * 问题：旧的章节使用单词计数（按空格分割），但实际应该使用字符数
 * 解决：重新计算所有章节的字符数并更新数据库
 */
export const POST = withAdminAuth(async (session, request: Request) => {
  try {
    // 1. 获取所有章节
    const chapters = await withRetry(
      () => prisma.chapter.findMany({
        select: {
          id: true,
          content: true,
          wordCount: true,
          novelId: true,
        }
      }),
      { operationName: 'Get all chapters for migration' }
    ) as any

    let updatedCount = 0
    let skippedCount = 0
    const errors: Array<{ chapterId: number; error: string }> = []

    // 2. 逐个更新章节的 wordCount
    for (const chapter of chapters) {
      try {
        // 计算正确的字符数
        const correctWordCount = chapter.content.trim().length

        // 只更新字符数不匹配的章节
        if (chapter.wordCount !== correctWordCount) {
          const oldWordCount = chapter.wordCount

          await withRetry(
            () => prisma.chapter.update({
              where: { id: chapter.id },
              data: { wordCount: correctWordCount }
            }),
            { operationName: `Update chapter ${chapter.id}` }
          )

          updatedCount++
        } else {
          skippedCount++
        }
      } catch (error: any) {
        errors.push({ chapterId: chapter.id, error: error.message })
      }
    }

    // 3. 重新计算每个小说的总字符数
    const novels = await withRetry(
      () => prisma.novel.findMany({
        select: { id: true }
      }),
      { operationName: 'Get all novels' }
    ) as any

    let novelsUpdated = 0

    for (const novel of novels) {
      try {
        // 聚合该小说所有章节的字符数
        const result = await withRetry(
          () => prisma.chapter.aggregate({
            where: { novelId: novel.id },
            _sum: { wordCount: true }
          }),
          { operationName: `Aggregate chapters for novel ${novel.id}` }
        ) as any

        const totalWordCount = result._sum.wordCount || 0

        await withRetry(
          () => prisma.novel.update({
            where: { id: novel.id },
            data: { wordCount: totalWordCount }
          }),
          { operationName: `Update novel ${novel.id}` }
        )

        novelsUpdated++
      } catch (error: any) {
        errors.push({ chapterId: novel.id, error: error.message })
      }
    }

    const summary = {
      totalChapters: chapters.length,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errors.length,
      novelsUpdated,
      errorDetails: errors,
    }

    return NextResponse.json({
      success: true,
      message: 'WordCount migration completed',
      summary,
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    )
  }
})
