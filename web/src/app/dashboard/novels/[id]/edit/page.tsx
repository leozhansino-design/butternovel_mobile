'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Upload, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import TagsInput from '@/components/shared/TagsInput'
import { CONTENT_RATING_OPTIONS, RIGHTS_TYPE_OPTIONS } from '@/lib/content-rating'
import { compressCoverImage, formatFileSize } from '@/lib/image-compress'
import { safeParseJson } from '@/lib/fetch-utils'
import { SHORT_NOVEL_GENRES } from '@/lib/short-novel'

// Regular novel categories
const regularGenres = [
  { id: 1, name: 'Fantasy' },
  { id: 2, name: 'Romance' },
  { id: 3, name: 'Urban' },
  { id: 4, name: 'Sci-Fi' },
  { id: 5, name: 'Mystery' },
  { id: 6, name: 'Horror' },
  { id: 7, name: 'Adventure' },
  { id: 8, name: 'Historical' },
  { id: 9, name: 'Crime' },
  { id: 10, name: 'LGBTQ+' },
  { id: 11, name: 'Paranormal' },
  { id: 12, name: 'System' },
  { id: 13, name: 'Reborn' },
  { id: 14, name: 'Revenge' },
  { id: 15, name: 'Fanfiction' },
]

const LIMITS = {
  TITLE_MAX: 120,
  BLURB_MAX: 3000,
}

const IMAGE_LIMITS = {
  MAX_SIZE: 2 * 1024 * 1024,
  REQUIRED_WIDTH: 300,
  REQUIRED_HEIGHT: 400,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}

export default function EditNovelPage() {
  const params = useParams()
  const router = useRouter()
  const novelId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [novel, setNovel] = useState<any>(null)
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [coverFile, setCoverFile] = useState<File | null>(null)  // ⭐ Store file for compression
  const [tags, setTags] = useState<string[]>([])
  const [compressing, setCompressing] = useState(false)

  const [isShortNovel, setIsShortNovel] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    blurb: '',
    categoryId: '',
    shortNovelGenre: '',
    status: 'ONGOING',
    contentRating: 'ALL_AGES',
    rightsType: 'ALL_RIGHTS_RESERVED',
    isPublished: false,
  })

  useEffect(() => {
    fetchNovel()
  }, [novelId])

  const fetchNovel = async () => {
    try {
      const response = await fetch(`/api/dashboard/novels/${novelId}`)
      if (response.ok) {
        const data = await response.json()
        setNovel(data.novel)
        setIsShortNovel(data.novel.isShortNovel || false)
        setFormData({
          title: data.novel.title,
          blurb: data.novel.blurb,
          categoryId: data.novel.categoryId?.toString() || '',
          shortNovelGenre: data.novel.shortNovelGenre || '',
          status: data.novel.status,
          contentRating: data.novel.contentRating || 'ALL_AGES',
          rightsType: data.novel.rightsType || 'ALL_RIGHTS_RESERVED',
          isPublished: data.novel.isPublished,
        })
        setCoverPreview(data.novel.coverImage || '')
        // ⭐ 加载标签
        setTags(data.novel.tags?.map((t: any) => t.name) || [])
      } else {
        alert('Failed to load novel')
        router.push('/dashboard/novels')
      }
    } catch (error) {
      console.error('Failed to fetch novel:', error)
      alert('An error occurred')
      router.push('/dashboard/novels')
    } finally {
      setLoading(false)
    }
  }

  // ⭐ Handle cover upload with compression
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!IMAGE_LIMITS.ALLOWED_TYPES.includes(file.type)) {
      alert('Invalid file type. Please upload JPG, PNG, or WebP image.')
      e.target.value = ''
      return
    }

    // Allow larger files since we'll compress them
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB.')
      e.target.value = ''
      return
    }

    setCompressing(true)

    try {
      // ⭐ Compress the image immediately
      const compressedBase64 = await compressCoverImage(file)
      setCoverPreview(compressedBase64)
      setCoverFile(file)  // Keep reference for logging

      console.log(`[EditNovel] Cover compressed: ${formatFileSize(file.size)} -> ${formatFileSize(Math.round(compressedBase64.length * 0.75))}`)
    } catch (error) {
      console.error('Image compression failed:', error)
      alert('Failed to compress image. Please try a different image.')
      e.target.value = ''
    } finally {
      setCompressing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.blurb.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setSaving(true)

    try {
      // ⭐ Use coverPreview (already compressed) if a new file was uploaded
      const newCoverImage = coverFile ? coverPreview : undefined

      // ⭐ Build request body (different for short novels)
      const requestBody: any = {
        title: formData.title,
        blurb: formData.blurb,
        status: formData.status,
        contentRating: formData.contentRating,
        rightsType: formData.rightsType,
        isPublished: formData.isPublished,
        coverImage: newCoverImage,
      }

      // Short novels use shortNovelGenre, regular novels use categoryId
      if (isShortNovel) {
        requestBody.shortNovelGenre = formData.shortNovelGenre
      } else {
        requestBody.categoryId = parseInt(formData.categoryId)
      }

      // ⭐ Check request size (Vercel limit: 4.5MB)
      const bodyString = JSON.stringify(requestBody)
      const bodySizeBytes = new Blob([bodyString]).size
      const bodySizeMB = bodySizeBytes / (1024 * 1024)

      console.log(`[EditNovel] Request size: ${bodySizeMB.toFixed(2)}MB`)

      if (bodySizeMB > 4.0) {
        throw new Error(`Request too large (${bodySizeMB.toFixed(2)}MB). Please use a smaller cover image.`)
      }

      const response = await fetch(`/api/dashboard/novels/${novelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: bodyString,
      })

      const data = await safeParseJson(response)

      if (!response.ok) {
        throw new Error(data.error || 'Update failed')
      }

      // ⭐ 更新标签
      const originalTags = novel.tags?.map((t: any) => t.name) || []
      const tagsChanged =
        tags.length !== originalTags.length ||
        tags.some((tag, index) => tag !== originalTags[index])

      if (tagsChanged) {
        try {
          const tagsResponse = await fetch(`/api/novels/${novelId}/tags`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tags }),
          })

          if (!tagsResponse.ok) {
            console.warn('Failed to update tags, but novel was updated successfully')
            alert('Novel updated successfully! Warning: Tags update failed.')
            router.push('/dashboard/novels')
            return
          }
        } catch (tagError) {
          console.error('Tags update error:', tagError)
          alert('Novel updated successfully! Warning: Tags update failed.')
          router.push('/dashboard/novels')
          return
        }
      }

      alert('Novel updated successfully!')
      router.push('/dashboard/novels')
    } catch (error: any) {
      console.error('Update error:', error)
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!novel) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link
            href="/dashboard/novels"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Stories
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Story</h1>
          <p className="text-sm text-gray-500 mt-1">Update your story information</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Story Information</h2>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= LIMITS.TITLE_MAX) {
                    setFormData({ ...formData, title: value })
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                maxLength={LIMITS.TITLE_MAX}
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-500">
                  {formData.title.length} / {LIMITS.TITLE_MAX}
                </span>
              </div>
            </div>

            {/* Cover Image - Only for regular novels */}
            {!isShortNovel && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image {coverFile && <span className="text-indigo-600">(New)</span>}
                </label>
                <p className="text-xs text-gray-500 mb-3">Required size: 300x400px, Max 2MB</p>

                <div className="flex items-start gap-4">
                  <div className="relative w-40 h-52 rounded-lg overflow-hidden border-2 border-gray-300">
                    <Image src={coverPreview} alt="Cover preview" fill className="object-cover" />
                    {coverFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setCoverPreview(novel.coverImage)
                          setCoverFile(null)
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <label className="flex flex-col items-center justify-center w-40 h-52 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors bg-gray-50">
                    <Upload className="text-gray-400 mb-2" size={28} />
                    <span className="text-sm text-gray-600 font-medium">Change Cover</span>
                    <span className="text-xs text-gray-400 mt-2">300x400px</span>
                    <span className="text-xs text-gray-400">Max 2MB</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Genre - Different for short novels vs regular novels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre <span className="text-red-500">*</span>
                {isShortNovel && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Short Novel
                  </span>
                )}
              </label>
              {isShortNovel ? (
                // Short novel genres - button grid like upload form
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SHORT_NOVEL_GENRES.map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, shortNovelGenre: genre.id })}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                        formData.shortNovelGenre === genre.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              ) : (
                // Regular novel categories - dropdown
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {regularGenres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <TagsInput
                value={tags}
                onChange={setTags}
              />
            </div>

            {/* Blurb */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blurb <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.blurb}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= LIMITS.BLURB_MAX) {
                    setFormData({ ...formData, blurb: value })
                  }
                }}
                rows={10}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
                  formData.blurb.length >= LIMITS.BLURB_MAX
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
                maxLength={LIMITS.BLURB_MAX}
              />
              <div className="flex justify-between items-center mt-1">
                <span className={`text-xs ${formData.blurb.length > 2850 ? 'text-red-500' : 'text-gray-500'}`}>
                  {formData.blurb.length} / {LIMITS.BLURB_MAX} characters
                </span>
                {formData.blurb.length >= LIMITS.BLURB_MAX && (
                  <span className="text-xs text-red-600">Limit reached</span>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="ONGOING"
                    checked={formData.status === 'ONGOING'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-sm">Ongoing</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="COMPLETED"
                    checked={formData.status === 'COMPLETED'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-sm">Completed</span>
                </label>
              </div>
            </div>

            {/* Content Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Rating <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.contentRating}
                onChange={(e) => setFormData({ ...formData, contentRating: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {CONTENT_RATING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                {CONTENT_RATING_OPTIONS.find(o => o.value === formData.contentRating)?.description}
              </p>
            </div>

            {/* Copyright License */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Copyright License <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.rightsType}
                onChange={(e) => setFormData({ ...formData, rightsType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {RIGHTS_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                {RIGHTS_TYPE_OPTIONS.find(o => o.value === formData.rightsType)?.description}
              </p>
            </div>

            {/* Publish Status */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Published</span>
              </label>
            </div>
          </div>
        </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/dashboard/novels"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors inline-flex items-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
