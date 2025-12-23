import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const novelId = parseInt(id)

    if (isNaN(novelId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid novel ID' },
        { status: 400 }
      )
    }

    // Get user session
    const session = await auth()

    // For now, we'll use likeCount as recommend count
    // In a full implementation, you'd track individual recommendations per user

    if (!session?.user?.id) {
      // Guest user - just increment temporarily (won't persist)
      const novel = await prisma.novel.findUnique({
        where: { id: novelId },
        select: { likeCount: true }
      })

      return NextResponse.json({
        success: true,
        isRecommended: true,
        recommendCount: (novel?.likeCount || 0) + 1,
        message: 'Sign in to save your recommendation'
      })
    }

    // Check if user already liked/recommended this novel
    const existingLike = await prisma.novelLike.findUnique({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId
        }
      }
    })

    let isRecommended: boolean
    let recommendCount: number

    if (existingLike) {
      // Remove recommendation
      await prisma.$transaction([
        prisma.novelLike.delete({
          where: {
            userId_novelId: {
              userId: session.user.id,
              novelId
            }
          }
        }),
        prisma.novel.update({
          where: { id: novelId },
          data: { likeCount: { decrement: 1 } }
        })
      ])

      const novel = await prisma.novel.findUnique({
        where: { id: novelId },
        select: { likeCount: true }
      })

      isRecommended = false
      recommendCount = novel?.likeCount || 0
    } else {
      // Add recommendation
      await prisma.$transaction([
        prisma.novelLike.create({
          data: {
            novelId,
            userId: session.user.id
          }
        }),
        prisma.novel.update({
          where: { id: novelId },
          data: { likeCount: { increment: 1 } }
        })
      ])

      const novel = await prisma.novel.findUnique({
        where: { id: novelId },
        select: { likeCount: true }
      })

      isRecommended = true
      recommendCount = novel?.likeCount || 0
    }

    return NextResponse.json({
      success: true,
      isRecommended,
      recommendCount
    })

  } catch (error) {
    console.error('Recommend API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process recommendation' },
      { status: 500 }
    )
  }
}
