// src/app/api/admin/novels/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { withAdminAuth } from '@/lib/admin-middleware'
import { uploadNovelCover, deleteImage } from '@/lib/cloudinary'
import { validateWithSchema, novelUpdateSchema } from '@/lib/validators'
import { invalidateNovelRelatedCache } from '@/lib/cache'
import { checkNovelTitleExists } from '@/lib/novel-queries'

// Next.js App Router - Route Segment Config
// Note: Vercel serverless functions have a 4.5MB body limit that cannot be increased
// Images must be compressed client-side before upload
export const maxDuration = 60  // 60 seconds timeout for large uploads
export const dynamic = 'force-dynamic'

// PUT /api/admin/novels/[id] - 更新小说（增量更新）
export const PUT = withAdminAuth(async (
  session,
  request: Request,
  props: { params: Promise<{ id: string }> }  // ⭐ Next.js 15
) => {
  try {
    const params = await props.params  // ⭐ await params
    const novelId = parseInt(params.id)
    const body = await request.json()

    // ✅ 使用 Zod 验证（验证基本字段，newCoverImage 在 schema 外处理）
    const { newCoverImage, ...updateFields } = body
    const validation = validateWithSchema(novelUpdateSchema, updateFields)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const updates = { ...validation.data, newCoverImage }

    // 获取当前小说数据
    // 🔄 添加数据库重试机制，解决连接超时问题
    const currentNovel = await withRetry(
      () => prisma.novel.findUnique({
        where: { id: novelId },
        select: {
          id: true,
          title: true,
          coverImage: true,
          coverImagePublicId: true
        }
      }),
      { operationName: 'Get current novel for update' }
    ) as any

    if (!currentNovel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    // 准备更新数据
    const data: any = {}

    // 1. 更新标题（如果改变了，重新生成 slug）
    if (updates.title && updates.title !== currentNovel.title) {
      // 检查新标题是否与其他小说重复
      const titleExists = await checkNovelTitleExists(updates.title, novelId)
      if (titleExists) {
        return NextResponse.json(
          { error: 'A novel with this title already exists. Please choose a different title.' },
          { status: 409 }  // 409 Conflict
        )
      }

      data.title = updates.title
      data.slug = updates.title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now()
    }

    // 2. 更新简介
    if (updates.blurb !== undefined) {
      data.blurb = updates.blurb
    }

    // 3. 更新分类
    if (updates.categoryId !== undefined) {
      data.categoryId = updates.categoryId
    }

    // 4. 更新状态
    if (updates.status !== undefined) {
      data.status = updates.status
    }

    // 5. 更新内容分级
    if (updates.contentRating !== undefined) {
      data.contentRating = updates.contentRating
    }

    // 6. 更新版权许可
    if (updates.rightsType !== undefined) {
      data.rightsType = updates.rightsType
    }

    // 7. 更新发布状态
    if (updates.isPublished !== undefined) {
      data.isPublished = updates.isPublished
      data.isDraft = !updates.isPublished
    }

    // 7.5. 更新短篇小说分类
    if (updates.shortNovelGenre !== undefined) {
      data.shortNovelGenre = updates.shortNovelGenre
    }

    // 8. 更新封面（如果有新图片）
    if (updates.newCoverImage) {

      try {
        // 上传新封面
        const coverResult = await uploadNovelCover(
          updates.newCoverImage,
          updates.title || currentNovel.title
        )

        data.coverImage = coverResult.url
        data.coverImagePublicId = coverResult.publicId

        // 删除旧封面（如果有 publicId）
        if (currentNovel.coverImagePublicId) {
          await deleteImage(currentNovel.coverImagePublicId)
        }

      } catch (uploadError: any) {
        return NextResponse.json(
          { error: `Failed to upload cover: ${uploadError.message}` },
          { status: 500 }
        )
      }
    }

    // 执行更新
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No changes to update' },
        { status: 400 }
      )
    }

    // 🔄 添加数据库重试机制，解决连接超时问题
    const updatedNovel = await withRetry(
      () => prisma.novel.update({
        where: { id: novelId },
        data,
        include: {
          category: true,
          chapters: true,
        }
      }),
      { operationName: 'Update novel in database' }
    ) as any

    // ⚡ 清除缓存：首页、分类页、小说详情
    await invalidateNovelRelatedCache(updatedNovel.slug, updatedNovel.category?.slug)

    return NextResponse.json({
      success: true,
      novel: updatedNovel,
      message: 'Novel updated successfully'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update novel' },
      { status: 500 }
    )
  }
})

// DELETE /api/admin/novels/[id] - 删除小说
export const DELETE = withAdminAuth(async (
  session,
  request: Request,
  props: { params: Promise<{ id: string }> }  // ⭐ Next.js 15
) => {
  try {
    const params = await props.params  // ⭐ await params
    const novelId = parseInt(params.id)

    // 获取小说信息（包括 slug 和 category，用于清除缓存）
    // 🔄 添加数据库重试机制，解决连接超时问题
    const novel = await withRetry(
      () => prisma.novel.findUnique({
        where: { id: novelId },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImagePublicId: true,
          category: {
            select: { slug: true }
          }
        }
      }),
      { operationName: 'Get novel for deletion' }
    ) as any

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    // 1. 删除 Cloudinary 封面（如果有）
    if (novel.coverImagePublicId) {
      await deleteImage(novel.coverImagePublicId)
    }

    // 2. 删除数据库记录（章节会级联删除）
    // 🔄 添加数据库重试机制，解决连接超时问题
    await withRetry(
      () => prisma.novel.delete({
        where: { id: novelId }
      }),
      { operationName: 'Delete novel from database' }
    )

    // ⚡ 清除缓存：首页、分类页、小说详情
    await invalidateNovelRelatedCache(novel.slug, novel.category?.slug)

    return NextResponse.json({
      success: true,
      message: 'Novel deleted successfully'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete novel' },
      { status: 500 }
    )
  }
})