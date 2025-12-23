import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import cloudinary from '@/lib/cloudinary'
import { validateWithSchema, novelCreateSchema } from '@/lib/validators'
import { invalidateNovelRelatedCache } from '@/lib/cache'
import { createNotification } from '@/lib/notification-service'
import { checkNovelTitleExists } from '@/lib/novel-queries'

// GET - List all novels by the current author
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const novels = await prisma.novel.findMany({
      where: {
        authorId: session.user.id,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        chapters: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }) as any[]

    const formattedNovels = novels.map((novel) => ({
      id: novel.id,
      title: novel.title,
      slug: novel.slug,
      coverImage: novel.coverImage,
      blurb: novel.blurb,
      status: novel.status,
      isPublished: novel.isPublished,
      isDraft: novel.isDraft,
      categoryName: novel.category.name,
      totalChapters: novel.chapters.length,
      viewCount: novel.viewCount,
      likeCount: novel.likeCount,
      commentCount: novel.commentCount,
      averageRating: novel.averageRating,
      totalRatings: novel.totalRatings,
      createdAt: novel.createdAt,
      updatedAt: novel.updatedAt,
    }))

    return NextResponse.json({ novels: formattedNovels })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch novels' },
      { status: 500 }
    )
  }
}

// POST - Create a new novel
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // ✅ Validate using Zod schema (validates title, blurb, chapters, etc.)
    const validation = validateWithSchema(novelCreateSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const { title, coverImage, categoryId, blurb, status, isPublished, chapters } = validation.data

    // Check for duplicate title
    const titleExists = await checkNovelTitleExists(title)
    if (titleExists) {
      return NextResponse.json(
        { error: 'A novel with this title already exists. Please choose a different title.' },
        { status: 409 }
      )
    }

    // Upload cover image to Cloudinary
    let coverImageUrl = ''
    let coverImagePublicId = ''

    if (coverImage.startsWith('data:image')) {
      const uploadResult = await cloudinary.uploader.upload(coverImage, {
        folder: 'butternovel/covers',
        transformation: [
          { width: 300, height: 400, crop: 'fill' },
        ],
      })
      coverImageUrl = uploadResult.secure_url
      coverImagePublicId = uploadResult.public_id
    } else {
      coverImageUrl = coverImage
    }

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now()

    // Calculate total word count
    const totalWordCount = chapters?.reduce((sum: number, ch: any) => {
      const words = ch.content.trim().split(/\s+/).filter((w: string) => w).length
      return sum + words
    }, 0) || 0

    // Create novel with chapters
    const novel = await prisma.novel.create({
      data: {
        title,
        slug,
        coverImage: coverImageUrl,
        coverImagePublicId,
        blurb,
        authorId: session.user.id,
        authorName: session.user.name || 'Anonymous Author',
        categoryId,
        status: status || 'ONGOING',
        isPublished: isPublished || false,
        isDraft: !isPublished,
        totalChapters: chapters?.length || 0,
        wordCount: totalWordCount,
        chapters: chapters
          ? {
              create: chapters.map((ch: any, index: number) => ({
                chapterNumber: index + 1,
                title: ch.title,
                slug: `${slug}-chapter-${index + 1}`,
                content: ch.content,
                wordCount: ch.content.trim().split(/\s+/).filter((w: string) => w).length,
                isPublished: isPublished || false,
              })),
            }
          : undefined,
      },
      include: {
        chapters: true,
        category: {
          select: { slug: true }
        }
      },
    })

    // ⚡ Clear cache: home page and category page
    await invalidateNovelRelatedCache(novel.slug, novel.category?.slug)

    // 通知所有粉丝（仅发布的小说）
    if (novel.isPublished) {
      try {
        const followers = await prisma.follow.findMany({
          where: { followingId: session.user.id },
          select: { followerId: true },
        });

        for (const follower of followers) {
          await createNotification({
            userId: follower.followerId,
            type: 'AUTHOR_NEW_NOVEL',
            actorId: session.user.id,
            data: {
              novelId: novel.id,
              novelSlug: novel.slug,
              novelTitle: novel.title,
            },
          });
        }
      } catch (error) {
        console.error('[Novel Create API] Failed to create follower notifications:', error);
      }
    }

    return NextResponse.json({
      message: 'Novel created successfully',
      novel,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create novel' },
      { status: 500 }
    )
  }
}
