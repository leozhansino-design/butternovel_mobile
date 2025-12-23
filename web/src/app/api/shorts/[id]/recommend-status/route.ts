import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const novelId = parseInt(id)

    if (isNaN(novelId)) {
      return NextResponse.json(
        { success: false, isRecommended: false },
        { status: 400 }
      )
    }

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        isRecommended: false
      })
    }

    const existingLike = await prisma.novelLike.findUnique({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId
        }
      }
    })

    return NextResponse.json({
      success: true,
      isRecommended: !!existingLike
    })

  } catch (error) {
    console.error('Recommend status API error:', error)
    return NextResponse.json(
      { success: false, isRecommended: false },
      { status: 500 }
    )
  }
}
