// src/components/admin/EditNovelForm.tsx - 优化版
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import TagsInput from '@/components/shared/TagsInput'
import { CONTENT_RATING_OPTIONS, RIGHTS_TYPE_OPTIONS } from '@/lib/content-rating'
import type { ContentRating, RightsType } from '@/lib/prisma-types'
import { compressCoverImage, formatFileSize } from '@/lib/image-compress'
import { safeParseJson } from '@/lib/fetch-utils'
import { SHORT_NOVEL_GENRES } from '@/lib/short-novel'

type Category = {
  id: number
  name: string
}

type Chapter = {
  id: number
  title: string
  slug: string
  content: string
  chapterNumber: number
  wordCount: number
  isPublished: boolean
}

type Novel = {
  id: number
  title: string
  slug: string
  coverImage: string
  coverImagePublicId: string | null
  blurb: string
  status: string
  isPublished: boolean
  contentRating: ContentRating
  rightsType: RightsType
  categoryId: number
  category: Category
  chapters: Chapter[]
  tags?: { name: string }[]
  isShortNovel?: boolean
  shortNovelGenre?: string | null
}

type Props = {
  novel: Novel
  categories: Category[]
}

export default function EditNovelForm({ novel, categories }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 基本信息状态
  const [title, setTitle] = useState(novel.title)
  const [blurb, setBlurb] = useState(novel.blurb)
  const [categoryId, setCategoryId] = useState(novel.categoryId.toString())
  const [status, setStatus] = useState(novel.status)
  const [isPublished, setIsPublished] = useState(novel.isPublished)
  const [contentRating, setContentRating] = useState<ContentRating>(novel.contentRating)
  const [rightsType, setRightsType] = useState<RightsType>(novel.rightsType)
  const [shortNovelGenre, setShortNovelGenre] = useState(novel.shortNovelGenre || '')
  const isShortNovel = novel.isShortNovel || false

  // 封面状态
  const [coverPreview, setCoverPreview] = useState(novel.coverImage)
  const [newCoverImage, setNewCoverImage] = useState<string | null>(null)

  // 标签状态
  const [tags, setTags] = useState<string[]>(novel.tags?.map(t => t.name) || [])

  // 追踪改动
  const [hasChanges, setHasChanges] = useState(false)

  // 封面上传状态
  const [compressing, setCompressing] = useState(false)

  // 处理封面上传 (带压缩)
  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    // 验证原始文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 10MB' })
      return
    }

    setCompressing(true)
    setMessage(null)

    try {
      // 压缩图片
      const compressedBase64 = await compressCoverImage(file)
      setCoverPreview(compressedBase64)
      setNewCoverImage(compressedBase64)
      setHasChanges(true)

      // 显示压缩信息
      const originalSize = formatFileSize(file.size)
      const compressedSize = formatFileSize(Math.round(compressedBase64.length * 0.75)) // Base64 to binary estimate
      setMessage({
        type: 'success',
        text: `Image compressed: ${originalSize} → ${compressedSize}`
      })
    } catch (error) {
      console.error('Image compression failed:', error)
      setMessage({ type: 'error', text: 'Failed to compress image. Please try a different image.' })
    } finally {
      setCompressing(false)
    }
  }

  // ✅ Auto-detect changes whenever any field changes (fixes async state update issue)
  useEffect(() => {
    const originalTags = novel.tags?.map(t => t.name) || []
    const tagsChanged =
      tags.length !== originalTags.length ||
      tags.some((tag, index) => tag !== originalTags[index])

    const changed =
      title !== novel.title ||
      blurb !== novel.blurb ||
      categoryId !== novel.categoryId.toString() ||
      status !== novel.status ||
      isPublished !== novel.isPublished ||
      contentRating !== novel.contentRating ||
      rightsType !== novel.rightsType ||
      newCoverImage !== null ||
      tagsChanged ||
      (isShortNovel && shortNovelGenre !== (novel.shortNovelGenre || ''))

    setHasChanges(changed)
  }, [title, blurb, categoryId, status, isPublished, contentRating, rightsType, newCoverImage, tags, novel, isShortNovel, shortNovelGenre])

  // ⭐ 保存为草稿 (不发布)
  async function handleSaveDraft() {
    return handleSave(false)
  }

  // ⭐ 保存并发布
  async function handlePublish() {
    return handleSave(true)
  }

  // 统一保存函数
  async function handleSave(publish: boolean) {
    if (!hasChanges && isPublished === publish) {
      setMessage({ type: 'error', text: 'No changes to save' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      // 构建更新数据
      const updates: any = {}

      if (title !== novel.title) updates.title = title
      if (blurb !== novel.blurb) updates.blurb = blurb
      if (categoryId !== novel.categoryId.toString()) updates.categoryId = parseInt(categoryId)
      if (status !== novel.status) updates.status = status
      if (contentRating !== novel.contentRating) updates.contentRating = contentRating
      if (rightsType !== novel.rightsType) updates.rightsType = rightsType
      if (newCoverImage) updates.newCoverImage = newCoverImage

      // Short novel genre update
      if (isShortNovel && shortNovelGenre !== (novel.shortNovelGenre || '')) {
        updates.shortNovelGenre = shortNovelGenre
      }

      // ⭐ 根据按钮设置发布状态
      updates.isPublished = publish

      // ⭐ 检查请求体大小 (Vercel 限制 4.5MB)
      const bodyString = JSON.stringify(updates)
      const bodySizeBytes = new Blob([bodyString]).size
      const bodySizeMB = bodySizeBytes / (1024 * 1024)
      const MAX_SIZE_MB = 4.0  // 留一些余量

      if (bodySizeMB > MAX_SIZE_MB) {
        throw new Error(
          `Request too large (${bodySizeMB.toFixed(2)}MB). ` +
          `Please use a smaller cover image. Maximum size: ${MAX_SIZE_MB}MB`
        )
      }

      console.log(`[EditNovel] Request size: ${bodySizeMB.toFixed(2)}MB`)

      const response = await fetch(`/api/admin/novels/${novel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ 确保 cookie 总是被发送
        body: bodyString
      })

      // ✅ 使用 safeParseJson 安全解析响应
      const data = await safeParseJson(response)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update novel')
      }

      // ⭐ 更新标签
      const originalTags = novel.tags?.map(t => t.name) || []
      const tagsChanged =
        tags.length !== originalTags.length ||
        tags.some((tag, index) => tag !== originalTags[index])

      if (tagsChanged) {
        try {
          const tagsResponse = await fetch(`/api/novels/${novel.id}/tags`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ tags }),
          })

          if (!tagsResponse.ok) {
            console.warn('Failed to update tags, but novel was updated successfully')
            setMessage({
              type: 'success',
              text: publish
                ? '✅ Novel published successfully! ⚠️ Warning: Tags update failed.'
                : '✅ Draft saved successfully! ⚠️ Warning: Tags update failed.'
            })
          } else {
            setMessage({
              type: 'success',
              text: publish ? '✅ Novel published successfully!' : '✅ Draft saved successfully!'
            })
          }
        } catch (tagError) {
          console.error('Tags update error:', tagError)
          setMessage({
            type: 'success',
            text: publish
              ? '✅ Novel published successfully! ⚠️ Warning: Tags update failed.'
              : '✅ Draft saved successfully! ⚠️ Warning: Tags update failed.'
          })
        }
      } else {
        setMessage({
          type: 'success',
          text: publish ? '✅ Novel published successfully!' : '✅ Draft saved successfully!'
        })
      }

      setHasChanges(false)
      setNewCoverImage(null)
      setIsPublished(publish) // 更新本地状态

      // 刷新页面数据
      router.refresh()

    } catch (error: any) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  // 切换章节发布状态
  async function toggleChapterPublish(chapterId: number, currentStatus: boolean) {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ 确保 cookie 总是被发送
        body: JSON.stringify({ isPublished: !currentStatus })
      })

      // ✅ 使用 safeParseJson 安全解析响应
      const data = await safeParseJson(response)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update chapter')
      }

      setMessage({
        type: 'success',
        text: !currentStatus ? '✅ Chapter published!' : '📝 Chapter unpublished'
      })
      
      router.refresh()

    } catch (error: any) {
      console.error('Toggle error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  // 删除小说
  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${novel.title}"?\n\nThis will also delete:\n- All chapters\n- Cover image from Cloudinary\n- All related data\n\nThis action cannot be undone!`)) {
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/admin/novels/${novel.id}`, {
        method: 'DELETE',
        credentials: 'include' // ✅ 确保 cookie 总是被发送
      })

      // ✅ 使用 safeParseJson 安全解析响应
      const data = await safeParseJson(response)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete novel')
      }

      router.push('/admin/novels')
      router.refresh()

    } catch (error: any) {
      console.error('Delete error:', error)
      setMessage({ type: 'error', text: error.message })
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* ⭐ 发布状态横幅 */}
      <div className={`p-4 rounded-lg border-2 ${
        isPublished 
          ? 'bg-green-50 border-green-300' 
          : 'bg-yellow-50 border-yellow-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPublished ? (
              <>
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className="font-bold text-green-900">✅ Published</p>
                  <p className="text-sm text-green-700">This novel is live and visible to readers</p>
                </div>
              </>
            ) : (
              <>
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className="font-bold text-yellow-900">📝 Draft</p>
                  <p className="text-sm text-yellow-700">This novel is not published yet</p>
                </div>
              </>
            )}
          </div>
          {hasChanges && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* 基本信息 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>

        <div className="space-y-4">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">{title.length}/120 characters</p>
          </div>

          {/* 简介 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={blurb}
              onChange={(e) => setBlurb(e.target.value)}
              maxLength={3000}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">{blurb.length}/3000 characters</p>
          </div>

          {/* 分类和状态 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isShortNovel ? 'Genre' : 'Category'} <span className="text-red-500">*</span>
              </label>
              {isShortNovel ? (
                <div className="grid grid-cols-2 gap-2">
                  {SHORT_NOVEL_GENRES.map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => setShortNovelGenre(genre.id)}
                      className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                        shortNovelGenre === genre.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 hover:border-blue-300 text-gray-700'
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Content Rating & Rights Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content Rating <span className="text-red-500">*</span>
              </label>
              <select
                value={contentRating}
                onChange={(e) => setContentRating(e.target.value as ContentRating)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CONTENT_RATING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                {CONTENT_RATING_OPTIONS.find(o => o.value === contentRating)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Copyright License <span className="text-red-500">*</span>
              </label>
              <select
                value={rightsType}
                onChange={(e) => setRightsType(e.target.value as RightsType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {RIGHTS_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                {RIGHTS_TYPE_OPTIONS.find(o => o.value === rightsType)?.description}
              </p>
            </div>
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <TagsInput
              value={tags}
              onChange={setTags}
            />
          </div>
        </div>
      </div>

      {/* 封面 - Hide for short novels */}
      {!isShortNovel && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cover Image</h2>

          <div className="flex gap-6">
            <div className="flex-shrink-0">
              {coverPreview && (
                <div className="relative w-48 h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image
                    src={coverPreview}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                disabled={compressing}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              {compressing ? (
                <div className="flex items-center gap-2 mt-2 text-blue-600">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm">Compressing image...</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">
                  Recommended: 300x400px. Images will be auto-compressed.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 章节列表 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Chapters ({novel.chapters.length})
          </h2>
          <Link
            href={`/admin/novels/${novel.id}/chapters/new`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + Add Chapter
          </Link>
        </div>

        {novel.chapters.length > 0 ? (
          <div className="space-y-2">
            {novel.chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-gray-900">
                      Chapter {chapter.chapterNumber}: {chapter.title}
                    </p>
                    {/* ⭐ 章节发布状态标识 */}
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      chapter.isPublished 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {chapter.isPublished ? '✅ Published' : '📝 Draft'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {chapter.wordCount.toLocaleString()} characters
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Link
                    href={`/admin/novels/${novel.id}/chapters/${chapter.id}/edit`}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Edit
                  </Link>
                  {/* ⭐ 快速发布/取消发布按钮 */}
                  <button
                    onClick={() => toggleChapterPublish(chapter.id, chapter.isPublished)}
                    disabled={saving}
                    className={`px-3 py-1.5 text-sm rounded font-medium ${
                      chapter.isPublished
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } disabled:opacity-50`}
                  >
                    {chapter.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No chapters yet. Add your first chapter to get started.
          </div>
        )}
      </div>

      {/* ⭐ 操作按钮 - 双按钮设计 */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleDelete}
          disabled={saving}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Delete Novel
        </button>

        <div className="flex gap-3">
          <Link
            href="/admin/novels"
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </Link>
          
          {/* ⭐ Save Draft 按钮 */}
          <button
            onClick={handleSaveDraft}
            disabled={saving || (!hasChanges && !isPublished)}
            className={`px-6 py-3 rounded-lg transition-colors font-medium ${
              hasChanges || isPublished
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          {/* ⭐ Publish 按钮 */}
          <button
            onClick={handlePublish}
            disabled={saving}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? 'Publishing...' : isPublished ? 'Update & Publish' : 'Publish Now'}
          </button>
        </div>
      </div>
    </div>
  )
}