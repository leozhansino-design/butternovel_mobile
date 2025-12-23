// src/app/api/novels/[id]/rating/check/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'

/**
 * GET /api/novels/[id]/rating/check
 * Check if user has rated this novel and return their rating
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ rating: null })
    }

    const params = await props.params
    const novelId = parseInt(params.id)

    if (isNaN(novelId)) {
      return NextResponse.json(
        { error: 'Invalid novel ID' },
        { status: 400 }
      )
    }

    const rating = await withRetry(
      () => prisma.rating.findUnique({
        where: {
          userId_novelId: {
            userId: session.user.id,
            novelId: novelId
          }
        },
        select: {
          score: true,
          createdAt: true
        }
      }),
      { operationName: 'Check user rating' }
    )

    return NextResponse.json({ rating })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check rating' },
      { status: 500 }
    )
  }
}
