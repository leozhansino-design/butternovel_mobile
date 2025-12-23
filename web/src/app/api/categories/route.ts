import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'

// GET /api/categories - 获取所有分类
export async function GET() {
  try {
    const categories = await withRetry(
      () => prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          order: true,
        },
        orderBy: {
          order: 'asc',
        },
      }),
      { operationName: 'Get all categories' }
    )

    return NextResponse.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
