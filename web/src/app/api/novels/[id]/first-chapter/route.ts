// src/app/api/novels/[id]/first-chapter/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get first chapter ID for a novel (for reading history tracking)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const novelId = parseInt(id)

    // Find the first published chapter
    const firstChapter = await prisma.chapter.findFirst({
      where: {
        novelId,
        isPublished: true,
      },
      orderBy: {
        chapterNumber: 'asc',
      },
      select: {
        id: true,
      },
    })

    if (!firstChapter) {
      return NextResponse.json(
        { error: 'No published chapters found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      chapterId: firstChapter.id,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch first chapter' },
      { status: 500 }
    )
  }
}
