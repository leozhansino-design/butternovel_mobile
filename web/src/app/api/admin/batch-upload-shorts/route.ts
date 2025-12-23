// app/api/admin/batch-upload-shorts/route.ts
// 批量上传短篇小说 API

import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-middleware'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-utils'
import { Prisma } from '@prisma/client'
import {
  generateSlugFromTitle,
} from '@/lib/batch-upload-utils'
import {
  validateShortNovelLength,
  generateReadingPreview,
} from '@/lib/short-novel'

// 路由配置
export const maxDuration = 60 // 60秒超时
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/batch-upload-shorts
 * 批量上传短篇小说
 *
 * JSON Body:
 * - title: string
 * - shortNovelGenre: string (short novel genre ID)
 * - blurb: string
 * - content: string (complete story content)
 * - contentRating: string (optional, defaults to 'ALL_AGES')
 */
export const POST = withAdminAuth(async (session, request: Request) => {
  try {
    const body = await request.json()
    const {
      title,
      shortNovelGenre,
      blurb,
      content,
      contentRating: contentRatingRaw,
    } = body

    // Validate required fields
    if (!title || !shortNovelGenre || !blurb || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, shortNovelGenre, blurb, content' },
        { status: 400 }
      )
    }

    // Validate content length
    const contentValidation = validateShortNovelLength(content.length)
    if (!contentValidation.valid) {
      return NextResponse.json(
        { error: contentValidation.message },
        { status: 400 }
      )
    }

    // Validate and set contentRating
    const validRatings = ['ALL_AGES', 'TEEN_13', 'MATURE_16', 'EXPLICIT_18']
    let contentRating: 'ALL_AGES' | 'TEEN_13' | 'MATURE_16' | 'EXPLICIT_18' = 'ALL_AGES'

    if (contentRatingRaw && validRatings.includes(contentRatingRaw)) {
      contentRating = contentRatingRaw as typeof contentRating
    }

    // 1. Get Admin Profile info
    const adminProfile = await withRetry(() =>
      prisma.adminProfile.findUnique({
        where: { email: session.email },
      })
    ) as { displayName: string | null; email: string; avatar: string | null } | null

    if (!adminProfile) {
      return NextResponse.json(
        { error: 'Admin profile not found' },
        { status: 404 }
      )
    }

    const authorName = adminProfile.displayName || 'ButterPicks'

    // 2. Find or create corresponding User account
    let user = await withRetry(() =>
      prisma.user.findUnique({
        where: { email: session.email },
        select: { id: true }
      })
    ) as { id: string } | null

    if (!user) {
      console.log(`[Batch Upload Shorts] User not found for ${session.email}, creating...`)

      try {
        user = await withRetry(() =>
          prisma.user.create({
            data: {
              email: adminProfile.email,
              name: authorName,
              avatar: adminProfile.avatar || null,
              role: 'ADMIN',
              isVerified: true,
            },
            select: { id: true }
          })
        ) as { id: string }
      } catch (createError: any) {
        if (createError?.code === 'P2002') {
          const uniqueName = `${authorName}-${Date.now()}`
          user = await withRetry(() =>
            prisma.user.create({
              data: {
                email: adminProfile.email,
                name: uniqueName,
                avatar: adminProfile.avatar || null,
                role: 'ADMIN',
                isVerified: true,
              },
              select: { id: true }
            })
          ) as { id: string }
        } else {
          throw createError
        }
      }
    }

    // 3. Check for duplicate title
    const existingNovel = await withRetry(() =>
      prisma.novel.findFirst({
        where: {
          title: {
            equals: title,
            mode: 'insensitive'
          }
        },
        select: { id: true, title: true }
      })
    ) as { id: number; title: string } | null

    if (existingNovel) {
      return NextResponse.json(
        { error: `Short novel "${title}" already exists (ID: ${existingNovel.id})` },
        { status: 409 }
      )
    }

    // 4. Get default category for short novels
    const defaultCategory = await withRetry(() =>
      prisma.category.findFirst({ orderBy: { order: 'asc' } })
    ) as { id: number; name: string; slug: string } | null

    if (!defaultCategory) {
      return NextResponse.json(
        { error: 'No categories found' },
        { status: 500 }
      )
    }

    // 5. Generate unique slug
    let slug = generateSlugFromTitle(title)
    let slugSuffix = 0
    while (true) {
      const existingSlug = await withRetry(() =>
        prisma.novel.findUnique({
          where: { slug },
          select: { id: true }
        })
      )
      if (!existingSlug) break
      slugSuffix++
      slug = `${generateSlugFromTitle(title)}-${slugSuffix}`
    }

    // 6. Generate reading preview
    const readingPreview = generateReadingPreview(content)

    // 7. Create short novel and chapter (transaction)
    const novel = await withRetry(() =>
      prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Create short novel
        const createdNovel = await tx.novel.create({
          data: {
            title,
            slug,
            blurb,
            coverImage: null, // Short novels don't need cover
            isShortNovel: true,
            shortNovelGenre,
            readingPreview,
            categoryId: defaultCategory.id,
            authorId: user!.id,
            authorName,
            status: 'COMPLETED', // Short novels are always complete
            isPublished: true,
            contentRating,
            rightsType: 'ALL_RIGHTS_RESERVED',
            totalChapters: 1,
            wordCount: content.length,
          }
        })

        // Create single chapter with content
        await tx.chapter.create({
          data: {
            title: 'Full Story',
            slug: `${slug}-full-story`,
            content,
            chapterNumber: 1,
            novelId: createdNovel.id,
            isPublished: true,
            wordCount: content.length,
          }
        })

        return createdNovel
      })
    ) as { id: number; title: string; slug: string }

    return NextResponse.json({
      success: true,
      novel: {
        id: novel.id,
        title: novel.title,
        slug: novel.slug,
        wordCount: content.length,
      }
    })

  } catch (error: any) {
    console.error('[Batch Upload Shorts] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
})
