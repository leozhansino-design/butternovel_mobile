// app/api/admin/batch-upload/route.ts
// 批量上传小说API

import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-middleware'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-utils'
import { v2 as cloudinary } from 'cloudinary'
import { Prisma } from '@prisma/client'
import {
  generateSlugFromTitle,
  calculateTotalWordCount,
  type ParsedNovel
} from '@/lib/batch-upload-utils'

// 路由配置：增加超时时间（适用于大文件上传）
export const maxDuration = 60 // 60秒超时
export const dynamic = 'force-dynamic'

// 配置Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * POST /api/admin/batch-upload
 * 上传单本小说（批量上传时前端会依次调用此API）
 *
 * FormData:
 * - coverImage: File
 * - title: string
 * - genre: string (category slug)
 * - blurb: string
 * - tags: string (JSON array)
 * - chapters: string (JSON array of {number, title, content})
 * - contentRating: string (optional, defaults to 'ALL_AGES')
 */
export const POST = withAdminAuth(async (session, request: Request) => {
  try {
    // 解析FormData
    const formData = await request.formData()
    const coverImage = formData.get('coverImage') as File
    const title = formData.get('title') as string
    const genre = formData.get('genre') as string
    const blurb = formData.get('blurb') as string
    const tagsJson = formData.get('tags') as string
    const chaptersJson = formData.get('chapters') as string
    const contentRatingRaw = formData.get('contentRating') as string | null

    if (!coverImage || !title || !genre || !blurb || !tagsJson || !chaptersJson) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const tags: string[] = JSON.parse(tagsJson)
    const chapters: ParsedNovel['chapters'] = JSON.parse(chaptersJson)

    // 验证和设置 contentRating
    const validRatings = ['ALL_AGES', 'TEEN_13', 'MATURE_16', 'EXPLICIT_18']
    let contentRating: 'ALL_AGES' | 'TEEN_13' | 'MATURE_16' | 'EXPLICIT_18' = 'ALL_AGES'

    if (contentRatingRaw && validRatings.includes(contentRatingRaw)) {
      contentRating = contentRatingRaw as typeof contentRating
    } else if (contentRatingRaw) {
      console.warn(`[Batch Upload] Invalid contentRating: ${contentRatingRaw}, using default: ALL_AGES`)
    }

    // 1. 获取 Admin Profile 信息
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

    // 2. 查找或创建对应的 User 账号
    // ⭐ CRITICAL FIX: 使用 User.id 而不是 session.id，解决 follow 错误
    let user = await withRetry(() =>
      prisma.user.findUnique({
        where: { email: session.email },
        select: { id: true }
      })
    ) as { id: string } | null

    // 如果 user 不存在，自动创建
    if (!user) {
      console.log(`[Batch Upload] User not found for ${session.email}, creating from admin_profile...`)

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

        console.log(`[Batch Upload] ✅ Successfully created user account: ${user.id}`)
      } catch (createError: any) {
        // 如果创建失败（可能是名字冲突），尝试使用唯一的名字
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
          console.log(`[Batch Upload] ✅ Created user with unique name: ${uniqueName}`)
        } else {
          throw createError
        }
      }
    }

    // 3. 检查书名是否重复
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
        { error: `小说《${title}》已存在（ID: ${existingNovel.id}）` },
        { status: 409 }
      )
    }

    // 4. 查找分类
    const category = await withRetry(() =>
      prisma.category.findFirst({
        where: {
          OR: [
            { slug: genre.toLowerCase() },
            { name: { equals: genre, mode: 'insensitive' } }
          ]
        }
      })
    ) as { id: number; name: string; slug: string } | null

    if (!category) {
      return NextResponse.json(
        { error: `分类 "${genre}" 不存在` },
        { status: 400 }
      )
    }

    // 5. 上传封面到Cloudinary
    const coverImageUrl = await uploadCoverToCloudinary(coverImage, title)

    // 6. 生成slug（确保唯一）
    let slug = generateSlugFromTitle(title)
    let slugSuffix = 0
    while (true) {
      const existingSlug = await withRetry(() =>
        prisma.novel.findUnique({
          where: { slug: slug },
          select: { id: true }
        })
      )
      if (!existingSlug) break
      slugSuffix++
      slug = `${generateSlugFromTitle(title)}-${slugSuffix}`
    }

    // 7. 计算统计数据
    const totalChapters = chapters.length
    const wordCount = calculateTotalWordCount(chapters)

    // 8. 创建小说和章节（使用事务）
    const novel = await withRetry(() =>
      prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 创建小说
        const createdNovel = await tx.novel.create({
          data: {
            title,
            slug,
            blurb,
            coverImage: coverImageUrl,
            categoryId: category.id,
            authorId: user.id, // ⭐ CRITICAL FIX: 使用 User.id，解决 follow 问题
            authorName: authorName, // 使用 admin profile 的 displayName
            status: 'COMPLETED', // 批量上传的小说默认已完结
            isPublished: true,
            contentRating: contentRating, // 从前端传来或默认 ALL_AGES
            rightsType: 'ALL_RIGHTS_RESERVED', // 批量上传默认 All Rights Reserved
            totalChapters,
            wordCount,
          }
        })

        // 创建所有章节（需要添加slug字段）
        await tx.chapter.createMany({
          data: chapters.map(chapter => ({
            title: chapter.title,
            slug: `${slug}-chapter-${chapter.number}`,
            content: chapter.content,
            chapterNumber: chapter.number,
            novelId: createdNovel.id,
            isPublished: true,
            wordCount: countWords(chapter.content),
          }))
        })

        // 创建tags关联
        if (tags.length > 0) {
          // 获取或创建tags
          const tagRecords = await Promise.all(
            tags.map(async (tagName) => {
              return tx.tag.upsert({
                where: { name: tagName },
                create: {
                  name: tagName,
                  slug: tagName,
                  count: 1
                },
                update: {
                  count: { increment: 1 }
                }
              })
            })
          )

          // 关联tags到小说
          await tx.novel.update({
            where: { id: createdNovel.id },
            data: {
              tags: {
                connect: tagRecords.map(tag => ({ id: tag.id }))
              }
            }
          })
        }

        return createdNovel
      })
    ) as { id: number; title: string; slug: string; [key: string]: any }

    return NextResponse.json({
      success: true,
      novel: {
        id: novel.id,
        title: novel.title,
        slug: novel.slug,
        totalChapters,
        wordCount,
      }
    })

  } catch (error: any) {
    console.error('[Batch Upload] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
})

/**
 * 上传封面到Cloudinary
 */
async function uploadCoverToCloudinary(file: File, novelTitle: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')
  const dataURI = `data:${file.type};base64,${base64}`

  // Sanitize novelTitle for Cloudinary public_id (remove special characters)
  const sanitizedTitle = novelTitle
    .substring(0, 30)
    .replace(/[^a-zA-Z0-9-_\s]/g, '') // Remove special chars except hyphen, underscore, space
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    || 'untitled' // Fallback if empty

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataURI,
      {
        folder: 'novel-covers',
        public_id: `batch-${Date.now()}-${sanitizedTitle}`,
        transformation: [
          { width: 300, height: 400, crop: 'fill' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`))
        } else if (result) {
          resolve(result.secure_url)
        } else {
          reject(new Error('Cloudinary upload failed: No result'))
        }
      }
    )
  })
}

/**
 * 简单的字数统计
 */
function countWords(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
  return chineseChars + englishWords
}
