'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Plus, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import TagsInput from '@/components/shared/TagsInput'
import { CONTENT_RATING_OPTIONS, RIGHTS_TYPE_OPTIONS } from '@/lib/content-rating'
import { safeParseJson } from '@/lib/fetch-utils'
import { compressCoverImage, formatFileSize } from '@/lib/image-compress'

// Category data (Genres)
const genres = [
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
  { id: 16, name: 'Humor' },
  { id: 17, name: 'Werewolf' },
  { id: 18, name: 'Vampire' },
]

// Limits
const LIMITS = {
  TITLE_MAX: 120,
  BLURB_MAX: 3000, // Maximum characters for novel blurb
  CHAPTER_TITLE_MAX: 100,
  CHAPTER_CONTENT_MAX: 30000, // Maximum characters for chapter content
}

// Image limits
const IMAGE_LIMITS = {
  MAX_SIZE: 2 * 1024 * 1024,
  REQUIRED_WIDTH: 300,
  REQUIRED_HEIGHT: 400,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}

export default function NovelUploadForm() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [coverFile, setCoverFile] = useState<File | null>(null)  // ⭐ Store file for compression
  const [tags, setTags] = useState<string[]>([])

  const [formData, setFormData] = useState({
    title: '',
    coverImage: '',
    categoryId: '',
    blurb: '',
    status: 'ONGOING',
    contentRating: 'ALL_AGES',
    rightsType: 'ALL_RIGHTS_RESERVED',
    isPublished: false,
  })

  // Handle cover upload - store file for compression on submit
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!IMAGE_LIMITS.ALLOWED_TYPES.includes(file.type)) {
      alert('Invalid file type. Please upload JPG, PNG, or WebP image.')
      e.target.value = ''
      return
    }

    if (file.size > IMAGE_LIMITS.MAX_SIZE) {
      alert(`File too large. Maximum size is ${IMAGE_LIMITS.MAX_SIZE / 1024 / 1024}MB.`)
      e.target.value = ''
      return
    }

    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      const width = img.width
      const height = img.height

      URL.revokeObjectURL(objectUrl)

      if (width !== IMAGE_LIMITS.REQUIRED_WIDTH || height !== IMAGE_LIMITS.REQUIRED_HEIGHT) {
        alert(
          `Invalid image size.\nRequired: ${IMAGE_LIMITS.REQUIRED_WIDTH}x${IMAGE_LIMITS.REQUIRED_HEIGHT}px\nYour image: ${width}x${height}px`
        )
        e.target.value = ''
        return
      }

      // ⭐ Store file reference for compression on submit
      setCoverFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string
        setCoverPreview(base64)
        setFormData({ ...formData, coverImage: 'pending' })  // Mark as pending
      }
      reader.readAsDataURL(file)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      alert('Failed to load image. Please try another file.')
      e.target.value = ''
    }

    img.src = objectUrl
  }

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    if (!formData.title.trim() || !coverFile || !formData.categoryId || !formData.blurb.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setUploading(true)

    try {
      // ⭐ Compress cover image before upload
      const compressedCover = await compressCoverImage(coverFile)
      console.log(`[NovelUpload] Cover compressed: ${formatFileSize(coverFile.size)} -> ${formatFileSize(Math.round(compressedCover.length * 0.75))}`)

      // ⭐ Build request body
      const requestBody = {
        title: formData.title,
        coverImage: compressedCover,
        categoryId: parseInt(formData.categoryId),
        blurb: formData.blurb,
        status: formData.status,
        contentRating: formData.contentRating,
        rightsType: formData.rightsType,
        isPublished: false,
        chapters: [],
      }

      // ⭐ Check request size (Vercel limit: 4.5MB)
      const bodyString = JSON.stringify(requestBody)
      const bodySizeBytes = new Blob([bodyString]).size
      const bodySizeMB = bodySizeBytes / (1024 * 1024)

      console.log(`[NovelUpload] Request size: ${bodySizeMB.toFixed(2)}MB`)

      if (bodySizeMB > 4.0) {
        throw new Error(`Request too large (${bodySizeMB.toFixed(2)}MB). Please use a smaller cover image.`)
      }

      const response = await fetch('/api/dashboard/novels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: bodyString,
      })

      const data = await safeParseJson(response)

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      // ⭐ 如果有标签，更新标签
      if (tags.length > 0) {
        try {
          const tagsResponse = await fetch(`/api/novels/${data.novel.id}/tags`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tags }),
          })

          if (!tagsResponse.ok) {
            console.warn('Failed to update tags, but novel was created successfully')
          }
        } catch (tagError) {
          console.error('Tags update error:', tagError)
        }
      }

      alert(`Success! Novel "${data.novel.title}" has been created! Redirecting to add first chapter...`)
      // Redirect to add first chapter page
      router.push(`/dashboard/novels/${data.novel.id}/chapters/new`)
    } catch (error: any) {
      console.error('Upload error:', error)
      alert('Error: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const blurbCharCount = formData.blurb.length
  const blurbWarning = blurbCharCount > 2850 // Warn at 95%
  const blurbError = blurbCharCount >= LIMITS.BLURB_MAX

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Novel Details (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Story Details</h2>

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
                placeholder="Enter your story title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                maxLength={LIMITS.TITLE_MAX}
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-500">
                  {formData.title.length} / {LIMITS.TITLE_MAX}
                </span>
              </div>
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
                rows={8}
                placeholder="Write a compelling blurb for your story..."
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none ${
                  blurbError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
                maxLength={LIMITS.BLURB_MAX}
              />
              <div className="flex justify-between items-center mt-1">
                <span className={`text-xs ${blurbWarning ? 'text-red-500' : 'text-gray-500'}`}>
                  {blurbCharCount} / {LIMITS.BLURB_MAX} characters
                </span>
                {blurbError && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Limit reached
                  </span>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a genre</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
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

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">Required size: 300x400px, Max 2MB</p>

              {coverPreview ? (
                <div className="relative w-40 h-52 rounded-lg overflow-hidden border-2 border-gray-300">
                  <Image src={coverPreview} alt="Cover preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverPreview('')
                      setCoverFile(null)  // ⭐ Clear file reference
                      setFormData({ ...formData, coverImage: '' })
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-40 h-52 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors bg-gray-50">
                  <Upload className="text-gray-400 mb-2" size={28} />
                  <span className="text-sm text-gray-600 font-medium">Upload Cover</span>
                  <span className="text-xs text-gray-400 mt-2">300x400px</span>
                  <span className="text-xs text-gray-400">Max 2MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </label>
              )}
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
          </div>
        </div>
      </div>

      {/* Right Column - Action Button (1/3 width) */}
      <div className="lg:col-span-1 space-y-6">
        {/* Info Note */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
          <div className="text-center py-8 mb-6">
            <div className="text-gray-400 mb-4">
              <Plus size={48} strokeWidth={1.5} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Your Story</h3>
            <p className="text-sm text-gray-600 mb-4">
              Fill in the story details and click the button below to create your novel.
            </p>
            <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="mb-1">💡 Tip: Add chapters after creating your story</p>
              <p>After creation, you'll be redirected to add your first chapter</p>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-lg"
          >
            {uploading ? 'Creating...' : 'Create My Story'}
          </button>
        </div>
      </div>
    </form>
  )
}
