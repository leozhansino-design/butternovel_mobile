// src/app/api/library/check/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ isInLibrary: false })
    }

    const { searchParams } = new URL(request.url)
    const novelId = searchParams.get('novelId')

    if (!novelId) {
      return NextResponse.json({ error: 'Novel ID required' }, { status: 400 })
    }

    const library = await prisma.library.findUnique({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId: parseInt(novelId)
        }
      }
    })

    return NextResponse.json({ isInLibrary: !!library })
  } catch (error) {
    return NextResponse.json({ isInLibrary: false })
  }
}