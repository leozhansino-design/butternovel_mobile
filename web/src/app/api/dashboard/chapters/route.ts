import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateWithSchema, chapterCreateSchema, countWords, WORD_LIMITS } from '@/lib/validators'
import { createNotification } from '@/lib/notification-service'

// POST - Create a new chapter
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // ✅ Validate using Zod schema (validates title, content length, etc.)
    const validation = validateWithSchema(chapterCreateSchema, {
      novelId: body.novelId,
      title: body.title,
      content: body.content,
      chapterNumber: 0, // Will be calculated below
      isPublished: body.isPublished,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const { novelId, title, content, isPublished } = validation.data

    // Check if novel belongs to this author
    const novel = await prisma.novel.findFirst({
      where: {
        id: novelId,
        authorId: session.user.id,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        authorId: true,
        isPublished: true,
        chapters: {
          orderBy: {
            chapterNumber: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!novel) {
      return NextResponse.json(
        { error: 'Novel not found or unauthorized' },
        { status: 404 }
      )
    }

    // Calculate next chapter number
    const nextChapterNumber = novel.chapters.length > 0
      ? novel.chapters[0].chapterNumber + 1
      : 1

    // Calculate word count
    const wordCount = content.trim().split(/\s+/).filter((w: string) => w).length

    // Generate slug
    const slug = `${novel.slug}-chapter-${nextChapterNumber}`

    // Create chapter
    const chapter = await prisma.chapter.create({
      data: {
        novelId,
        chapterNumber: nextChapterNumber,
        title,
        slug,
        content,
        wordCount,
        isPublished: isPublished !== undefined ? isPublished : true,
      },
    })

    // Update novel statistics
    await prisma.novel.update({
      where: { id: novelId },
      data: {
        totalChapters: { increment: 1 },
        wordCount: { increment: wordCount },
      },
    })

    // Auto-publish novel when a chapter is published
    if (isPublished === true && !novel.isPublished) {
      // Chapter is being published and novel is still a draft
      await prisma.novel.update({
        where: { id: novelId },
        data: { isPublished: true },
      })
    }

    // 通知粉丝和书架用户（仅发布的章节）
    if (isPublished) {
      try {
        // 1. 通知所有粉丝
        const followers = await prisma.follow.findMany({
          where: { followingId: novel.authorId },
          select: { followerId: true },
        });

        for (const follower of followers) {
          await createNotification({
            userId: follower.followerId,
            type: 'AUTHOR_NEW_CHAPTER',
            actorId: novel.authorId,
            data: {
              novelId: novel.id,
              novelSlug: novel.slug,
              novelTitle: novel.title,
              chapterId: chapter.id,
              chapterNumber: chapter.chapterNumber,
              chapterTitle: chapter.title,
            },
          });
        }

        // 2. 通知书架用户（未关注作者但加入书架）
        const followerIds = followers.map((f: { followerId: string }) => f.followerId);
        const libraryUsers = await prisma.library.findMany({
          where: {
            novelId: novel.id,
            userId: { notIn: followerIds },
          },
          select: { userId: true },
        });

        for (const lib of libraryUsers) {
          await createNotification({
            userId: lib.userId,
            type: 'NOVEL_UPDATE',
            data: {
              novelId: novel.id,
              novelSlug: novel.slug,
              novelTitle: novel.title,
              chapterId: chapter.id,
              chapterNumber: chapter.chapterNumber,
              chapterTitle: chapter.title,
            },
          });
        }
      } catch (error) {
        console.error('[Chapter Create API] Failed to create notifications:', error);
      }
    }

    return NextResponse.json({
      message: 'Chapter created successfully',
      chapter,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create chapter' },
      { status: 500 }
    )
  }
}
