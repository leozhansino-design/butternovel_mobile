import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 移动端 API: 获取短篇小说详情
 * GET /api/mobile/shorts/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const novelId = parseInt(id)

    if (isNaN(novelId)) {
      return NextResponse.json(
        { error: 'Invalid novel ID' },
        { status: 400 }
      )
    }

    const novel = await prisma.novel.findFirst({
      where: {
        id: novelId,
        isShortNovel: true,
        isPublished: true,
        isBanned: false,
      },
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
        chapters: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            content: true,
            wordCount: true,
            order: true,
          },
          orderBy: { order: 'asc' },
          take: 1, // 短篇小说通常只有一章
        },
      },
    })

    if (!novel) {
      return NextResponse.json(
        { error: 'Novel not found' },
        { status: 404 }
      )
    }

    // 增加阅读量
    await prisma.novel.update({
      where: { id: novelId },
      data: { viewCount: { increment: 1 } },
    })

    // 获取正文内容
    const content = novel.chapters[0]?.content || novel.readingPreview || ''

    return NextResponse.json({
      id: novel.id.toString(),
      title: novel.title,
      slug: novel.slug,
      blurb: novel.blurb || '',
      content: content,
      category: novel.shortNovelGenre || 'General',
      wordCount: novel.wordCount,
      readCount: novel.viewCount + 1,
      likeCount: novel.likeCount,
      commentCount: novel.commentCount,
      averageRating: novel.averageRating,
      authorId: novel.authorId,
      authorName: novel.authorName,
      createdAt: novel.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Mobile short detail API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch novel' },
      { status: 500 }
    )
  }
}
