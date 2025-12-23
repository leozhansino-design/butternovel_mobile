// src/app/api/novels/[id]/user-rating/route.ts
// 获取当前用户对该小说的评分状态

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { hasRated: false, rating: null },
        { status: 200 }
      )
    }

    const { id } = await context.params
    const novelId = parseInt(id)

    if (isNaN(novelId)) {
      return NextResponse.json(
        { error: 'Invalid novel ID' },
        { status: 400 }
      )
    }

    // 查找用户的评分
    const rating = await prisma.rating.findUnique({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId,
        },
      },
      select: {
        id: true,
        score: true,
        review: true,
        createdAt: true,
      },
    })

    if (!rating) {
      return NextResponse.json({
        hasRated: false,
        rating: null,
      })
    }

    return NextResponse.json({
      hasRated: true,
      rating,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
