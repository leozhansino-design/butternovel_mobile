import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const novels = await prisma.novel.findMany({
      where: {
        authorId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        isPublished: true,
        viewCount: true,
        likeCount: true,
        _count: {
          select: {
            chapters: true,
            ratings: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ novels })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
