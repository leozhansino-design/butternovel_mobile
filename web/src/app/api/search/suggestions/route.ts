import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { SHORT_NOVEL_GENRES } from '@/lib/short-novel'

// GET /api/search/suggestions?q=the+truth
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    // Need at least 2 characters to start searching
    if (query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    const normalizedQuery = query.trim().toLowerCase()

    // Search titles, return top 10 suggestions (both regular and short novels)
    const suggestions = await withRetry(
      () => prisma.novel.findMany({
        where: {
          isPublished: true,
          isBanned: false,
          title: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          isShortNovel: true,
          shortNovelGenre: true,
          category: {
            select: {
              name: true,
            },
          },
        },
        take: 10,
      }),
      { operationName: 'Get search suggestions' }
    ) as any[]

    // Sort by relevance: title starts with query > contains query
    const sortedSuggestions = suggestions.sort((a, b) => {
      const aTitle = a.title.toLowerCase()
      const bTitle = b.title.toLowerCase()
      const aStartsWith = aTitle.startsWith(normalizedQuery)
      const bStartsWith = bTitle.startsWith(normalizedQuery)

      // Prioritize results that start with the query
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1

      // Then sort by title length (shorter = more relevant)
      return aTitle.length - bTitle.length
    })

    return NextResponse.json({
      success: true,
      data: sortedSuggestions.map(novel => {
        // For short novels, get genre name from SHORT_NOVEL_GENRES
        let categoryName = novel.category?.name || 'Uncategorized'
        if (novel.isShortNovel && novel.shortNovelGenre) {
          const genre = SHORT_NOVEL_GENRES.find(g => g.id === novel.shortNovelGenre)
          categoryName = genre?.name || novel.shortNovelGenre
        }

        return {
          id: novel.id,
          title: novel.title,
          slug: novel.slug,
          coverImage: novel.coverImage,
          category: categoryName,
          isShortNovel: novel.isShortNovel || false,
        }
      }),
    })
  } catch (error) {
    console.error('Search suggestions API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
