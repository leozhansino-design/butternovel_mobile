// src/app/api/ratings/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification, deleteLikeNotification } from '@/lib/notification-service'
import crypto from 'crypto'

// 生成游客ID
function generateGuestId(ipAddress: string, userAgent: string): string {
  const data = `${ipAddress}:${userAgent}`
  return crypto.createHash('md5').update(data).digest('hex')
}

// POST - 点赞/取消点赞
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ratingId = id

    // 获取session (可以为null，游客也能点赞)
    const session = await auth()
    const userId = session?.user?.id || null

    // 获取IP和UserAgent
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const guestId = userId ? null : generateGuestId(ipAddress, userAgent)

    // 检查评分是否存在
    const rating = await prisma.rating.findUnique({
      where: { id: ratingId },
      select: {
        id: true,
        likeCount: true,
        userId: true,
        novelId: true,
        novel: {
          select: {
            slug: true,
          },
        },
      },
    })

    if (!rating) {
      return NextResponse.json(
        { error: 'Rating not found' },
        { status: 404 }
      )
    }

    // 检查是否已点赞
    const existingLike = await prisma.ratingLike.findFirst({
      where: userId
        ? { userId, ratingId }
        : { guestId, ratingId }
    })

    if (existingLike) {
      // 已点赞，取消点赞
      await prisma.$transaction([
        prisma.ratingLike.delete({
          where: { id: existingLike.id }
        }),
        prisma.rating.update({
          where: { id: ratingId },
          data: { likeCount: { decrement: 1 } }
        })
      ])

      const updatedRating = await prisma.rating.findUnique({
        where: { id: ratingId },
        select: { likeCount: true }
      })

      // 删除对应的通知（仅登录用户）
      if (userId && rating.userId !== userId) {
        try {
          await deleteLikeNotification({
            userId: rating.userId,
            actorId: userId,
            type: 'RATING_LIKE',
            ratingId: rating.id,
          });
        } catch (error) {
          console.error('[Rating Like API] Failed to delete notification:', error);
        }
      }

      return NextResponse.json({
        liked: false,
        likeCount: updatedRating?.likeCount || 0
      })
    } else {
      // 未点赞，添加点赞
      await prisma.$transaction([
        prisma.ratingLike.create({
          data: {
            ratingId,
            userId,
            guestId,
            ipAddress,
            userAgent
          }
        }),
        prisma.rating.update({
          where: { id: ratingId },
          data: { likeCount: { increment: 1 } }
        })
      ])

      const updatedRating = await prisma.rating.findUnique({
        where: { id: ratingId },
        select: { likeCount: true }
      })

      // 发送通知给评分作者（仅登录用户且不是自己点赞）
      if (userId && rating.userId !== userId) {
        try {
          await createNotification({
            userId: rating.userId,
            type: 'RATING_LIKE',
            actorId: userId,
            data: {
              ratingId: rating.id,
              novelId: rating.novelId,
              novelSlug: rating.novel.slug,
            },
          });
        } catch (error) {
          console.error('[Rating Like API] Failed to create notification:', error);
        }
      }

      return NextResponse.json({
        liked: true,
        likeCount: updatedRating?.likeCount || 0
      })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}

// GET - 检查是否已点赞
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ratingId = id

    const session = await auth()
    const userId = session?.user?.id || null

    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const guestId = userId ? null : generateGuestId(ipAddress, userAgent)

    const existingLike = await prisma.ratingLike.findFirst({
      where: userId
        ? { userId, ratingId }
        : { guestId, ratingId }
    })

    return NextResponse.json({
      liked: !!existingLike
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check like status' },
      { status: 500 }
    )
  }
}
