// src/app/api/paragraph-comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadCommentImage } from '@/lib/cloudinary'
import { createNotification } from '@/lib/notification-service'
import { Prisma } from '@prisma/client'

// GET - 获取某个段落的评论
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const chapterId = searchParams.get('chapterId')
    const paragraphIndex = searchParams.get('paragraphIndex')

    if (!chapterId || !paragraphIndex) {
      return NextResponse.json(
        { success: false, error: 'Missing chapterId or paragraphIndex' },
        { status: 400 }
      )
    }

    const comments = await prisma.paragraphComment.findMany({
      where: {
        chapterId: parseInt(chapterId),
        paragraphIndex: parseInt(paragraphIndex),
        parentId: null, // Only get top-level comments, not replies
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            level: true,
            contributionPoints: true,
            role: true,
            isOfficial: true,
          }
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: [
        { likeCount: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ success: true, data: comments })
  } catch (error: any) {
    console.error('Failed to fetch paragraph comments:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - 发表段落评论
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { novelId, chapterId, paragraphIndex, content, image } = body

    if (!novelId || !chapterId || paragraphIndex === undefined || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 验证内容长度
    if (content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment content cannot be empty' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Comment content too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    let imageUrl: string | undefined
    let imagePublicId: string | undefined

    // 如果有图片，上传到Cloudinary
    if (image) {
      try {
        // 验证图片大小（前端应该已经验证过，这里再验证一次）
        const base64Length = image.length - (image.indexOf(',') + 1)
        const sizeInBytes = (base64Length * 3) / 4
        const sizeInMB = sizeInBytes / (1024 * 1024)

        if (sizeInMB > 2) {
          return NextResponse.json(
            { success: false, error: 'Image size exceeds 2MB limit' },
            { status: 400 }
          )
        }

        const result = await uploadCommentImage(image, session.user.id)
        imageUrl = result.url
        imagePublicId = result.publicId
      } catch (error: any) {
        console.error('Failed to upload comment image:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to upload image' },
          { status: 500 }
        )
      }
    }

    // 获取小说信息（用于通知作者）
    const novel = await prisma.novel.findUnique({
      where: { id: parseInt(novelId) },
      select: {
        authorId: true,
        slug: true,
        title: true,
      },
    });

    if (!novel) {
      return NextResponse.json(
        { success: false, error: 'Novel not found' },
        { status: 404 }
      );
    }

    // 获取章节信息
    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(chapterId) },
      select: {
        chapterNumber: true,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // 创建评论（使用事务）
    const comment = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. 创建评论
      const newComment = await tx.paragraphComment.create({
        data: {
          novelId: parseInt(novelId),
          chapterId: parseInt(chapterId),
          paragraphIndex: parseInt(paragraphIndex),
          content: content.trim(),
          imageUrl,
          imagePublicId,
          userId: session.user.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              level: true,
              contributionPoints: true,
              role: true,
              isOfficial: true,
            }
          },
          _count: {
            select: {
              replies: true,
            },
          },
        }
      })

      // 2. 添加贡献度积分
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          contributionPoints: {
            increment: 5,
          },
        },
      })

      // 3. 创建贡献度日志
      await tx.contributionLog.create({
        data: {
          userId: session.user.id,
          type: 'COMMENT',
          points: 5,
          description: 'Posted a paragraph comment',
        },
      })

      return newComment
    })

    // 发送通知给小说作者
    if (novel.authorId !== session.user.id) {
      try {
        await createNotification({
          userId: novel.authorId,
          type: 'NOVEL_COMMENT',
          actorId: session.user.id,
          data: {
            novelId: parseInt(novelId),
            novelSlug: novel.slug,
            novelTitle: novel.title,
            chapterId: parseInt(chapterId),
            chapterNumber: chapter.chapterNumber,
            commentId: comment.id, // 添加 commentId 以便跳转到评论位置
            commentContent: content.trim(),
          },
        });
      } catch (error) {
        console.error('[Paragraph Comment API] Failed to create notification:', error);
      }
    }

    return NextResponse.json({ success: true, data: comment })
  } catch (error: any) {
    console.error('Failed to create paragraph comment:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
