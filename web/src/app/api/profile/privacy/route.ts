// src/app/api/profile/privacy/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// PATCH - Update privacy settings
export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { libraryPrivacy } = body

    if (typeof libraryPrivacy !== 'boolean') {
      return NextResponse.json({ error: 'Invalid privacy setting' }, { status: 400 })
    }

    // Update user privacy settings
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        libraryPrivacy
      },
      select: {
        id: true,
        libraryPrivacy: true
      }
    })

    return NextResponse.json({
      message: 'Privacy settings updated successfully',
      libraryPrivacy: updatedUser.libraryPrivacy
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update privacy settings' }, { status: 500 })
  }
}
