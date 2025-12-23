// src/app/api/views/track/route.ts
import { NextResponse } from 'next/server'
import { trackView } from '@/lib/view-tracker'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { novelId } = await request.json()

    if (!novelId) {
      return NextResponse.json(
        { error: 'Missing novelId' },
        { status: 400 }
      )
    }

    // Get session (can be null for guests)
    const session = await auth()

    // Get IP address and User Agent
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Track view (works for both authenticated users and guests)
    const result = await trackView({
      novelId: parseInt(novelId),
      userId: session?.user?.id || null,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      counted: result.counted,
      viewCount: result.viewCount,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    )
  }
}
