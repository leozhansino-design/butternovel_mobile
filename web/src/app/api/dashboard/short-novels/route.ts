import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { withRetry } from '@/lib/db-retry'
import { Prisma } from '@prisma/client'
import {
  SHORT_NOVEL_LIMITS,
  validateShortNovelLength,
  generateReadingPreview,
} from '@/lib/short-novel'

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100)
}

// Create a short novel
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      blurb,
      content,
      shortNovelGenre,
      contentRating = 'ALL_AGES',
    } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!blurb?.trim()) {
      return NextResponse.json({ error: 'Blurb is required' }, { status: 400 })
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    if (!shortNovelGenre) {
      return NextResponse.json({ error: 'Genre is required' }, { status: 400 })
    }

    // Validate title length
    if (title.length > SHORT_NOVEL_LIMITS.TITLE_MAX) {
      return NextResponse.json({
        error: `Title must be ${SHORT_NOVEL_LIMITS.TITLE_MAX} characters or less`
      }, { status: 400 })
    }

    // Validate content length
    const contentValidation = validateShortNovelLength(content.length)
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.message }, { status: 400 })
    }

    // Generate slug and ensure uniqueness
    let slug = generateSlug(title)
    const existingSlug = await withRetry(
      () => prisma.novel.findFirst({ where: { slug } }),
      { operationName: 'Check slug uniqueness' }
    )

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    // Generate reading preview
    const readingPreview = generateReadingPreview(content)

    // Get user info
    const user = await withRetry(
      () => prisma.user.findUnique({
        where: { id: session.user!.id },
        select: { name: true, writerName: true },
      }),
      { operationName: 'Get user info' }
    ) as { name: string | null; writerName: string | null } | null

    const authorName = user?.writerName || user?.name || 'Anonymous'

    // Get a default category (we need one even for short novels due to schema requirement)
    // Using the first category as default
    const defaultCategory = await withRetry(
      () => prisma.category.findFirst({ orderBy: { order: 'asc' } }),
      { operationName: 'Get default category' }
    ) as { id: number } | null

    if (!defaultCategory) {
      return NextResponse.json({ error: 'No categories found' }, { status: 500 })
    }

    // Create novel and chapter in a transaction
    const novel = await withRetry(
      () => prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Create the short novel
        const newNovel = await tx.novel.create({
          data: {
            title: title.trim(),
            slug,
            blurb: blurb.trim(),
            coverImage: null, // Short novels don't need cover images
            isShortNovel: true,
            shortNovelGenre,
            readingPreview,
            authorId: session.user!.id,
            authorName,
            categoryId: defaultCategory.id,
            status: 'COMPLETED', // Short novels are always complete
            isPublished: false,
            isDraft: true,
            wordCount: content.length,
            contentRating: contentRating as any,
          },
        })

        // Create single chapter with the content
        await tx.chapter.create({
          data: {
            novelId: newNovel.id,
            chapterNumber: 1,
            title: 'Full Story',
            slug: 'full-story',
            content: content.trim(),
            wordCount: content.length,
            isPublished: true,
          },
        })

        // Update novel's total chapters
        await tx.novel.update({
          where: { id: newNovel.id },
          data: { totalChapters: 1 },
        })

        return newNovel
      }),
      { operationName: 'Create short novel' }
    ) as { id: number; title: string; slug: string }

    return NextResponse.json({
      success: true,
      novel: {
        id: novel.id,
        title: novel.title,
        slug: novel.slug,
      },
    })
  } catch (error: any) {
    console.error('[ShortNovel API] Error creating short novel:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create short novel' },
      { status: 500 }
    )
  }
}
