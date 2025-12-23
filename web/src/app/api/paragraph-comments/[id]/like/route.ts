// src/app/api/paragraph-comments/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification, deleteLikeNotification } from '@/lib/notification-service'
import crypto from 'crypto'

// POST - 点赞段落评论
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await context.params
    const commentId = id

    // 检查评论是否存在
    const comment = await prisma.paragraphComment.findUnique({
      where: { id: commentId },
      include: {
        novel: {
          select: {
            slug: true,
          },
        },
        chapter: {
          select: {
            chapterNumber: true,
          },
        },
      },
    })

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      )
    }

    let userId: string | undefined
    let guestId: string | undefined
    let ipAddress: string | undefined
    let userAgent: string | undefined

    if (session?.user?.id) {
      // 登录用户
      userId = session.user.id
    } else {
      // 游客
      const forwarded = request.headers.get('x-forwarded-for')
      ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
      userAgent = request.headers.get('user-agent') || 'unknown'

      // 生成游客ID（基于IP和UserAgent）
      const hash = crypto.createHash('sha256')
      hash.update(`${ipAddress}-${userAgent}`)
      guestId = hash.digest('hex')
    }

    // 检查是否已经点赞
    const existingLike = await prisma.paragraphCommentLike.findFirst({
      where: {
        commentId,
        OR: [
          userId ? { userId } : { userId: null },
          guestId ? { guestId } : { guestId: null }
        ]
      }
    })

    if (existingLike) {
      return NextResponse.json(
        { success: false, error: 'Already liked' },
        { status: 400 }
      )
    }

    // 创建点赞并更新评论的点赞数
    await prisma.$transaction([
      prisma.paragraphCommentLike.create({
        data: {
          commentId,
          userId,
          guestId,
          ipAddress,
          userAgent
        }
      }),
      prisma.paragraphComment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } }
      })
    ])

    // 发送通知给评论作者（仅登录用户且不是自己点赞）
    if (userId && comment.userId !== userId) {
      try {
        await createNotification({
          userId: comment.userId,
          type: 'COMMENT_LIKE',
          actorId: userId,
          data: {
            commentId: comment.id,
            novelId: comment.novelId,
            novelSlug: comment.novel.slug,
            chapterId: comment.chapterId,
            chapterNumber: comment.chapter.chapterNumber,
          },
        });
      } catch (error) {
        console.error('[Comment Like API] Failed to create notification:', error);
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to like paragraph comment:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - 取消点赞段落评论
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await context.params
    const commentId = id

    let userId: string | undefined
    let guestId: string | undefined

    if (session?.user?.id) {
      userId = session.user.id
    } else {
      const forwarded = request.headers.get('x-forwarded-for')
      const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      const hash = crypto.createHash('sha256')
      hash.update(`${ipAddress}-${userAgent}`)
      guestId = hash.digest('hex')
    }

    // 获取评论信息（用于删除通知）
    const comment = await prisma.paragraphComment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    // 查找点赞记录
    const like = await prisma.paragraphCommentLike.findFirst({
      where: {
        commentId,
        OR: [
          userId ? { userId } : { userId: null },
          guestId ? { guestId } : { guestId: null }
        ]
      }
    })

    if (!like) {
      return NextResponse.json(
        { success: false, error: 'Like not found' },
        { status: 404 }
      )
    }

    // 删除点赞并更新评论的点赞数
    await prisma.$transaction([
      prisma.paragraphCommentLike.delete({
        where: { id: like.id }
      }),
      prisma.paragraphComment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } }
      })
    ])

    // 删除对应的通知（仅登录用户）
    if (userId && comment.userId !== userId) {
      try {
        await deleteLikeNotification({
          userId: comment.userId,
          actorId: userId,
          type: 'COMMENT_LIKE',
          commentId,
        });
      } catch (error) {
        console.error('[Comment Like API] Failed to delete notification:', error);
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to unlike paragraph comment:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
