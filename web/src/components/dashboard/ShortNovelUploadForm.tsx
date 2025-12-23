'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Zap } from 'lucide-react'
import {
  SHORT_NOVEL_GENRES,
  SHORT_NOVEL_LIMITS,
  validateShortNovelLength,
  estimateReadingTime,
  formatReadingTime,
  generateReadingPreview,
} from '@/lib/short-novel'
import { CONTENT_RATING_OPTIONS } from '@/lib/content-rating'
import { safeParseJson } from '@/lib/fetch-utils'

export default function ShortNovelUploadForm() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    shortNovelGenre: '',
    blurb: '',
    content: '',
    contentRating: 'ALL_AGES',
    isPublished: false,
  })

  // Character counts
  const titleCharCount = formData.title.length
  const blurbCharCount = formData.blurb.length
  const contentCharCount = formData.content.length

  // Validation
  const titleError = titleCharCount > SHORT_NOVEL_LIMITS.TITLE_MAX
  const contentValidation = validateShortNovelLength(contentCharCount)
  const readingTime = estimateReadingTime(contentCharCount)

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }
    if (!formData.shortNovelGenre) {
      alert('Please select a genre')
      return
    }
    if (!formData.blurb.trim()) {
      alert('Please enter a blurb')
      return
    }
    if (!formData.content.trim()) {
      alert('Please enter your story content')
      return
    }

    // Validate content length
    if (!contentValidation.valid) {
      alert(contentValidation.message)
      return
    }

    setUploading(true)

    try {
      // Generate reading preview
      const readingPreview = generateReadingPreview(formData.content)

      const requestBody = {
        title: formData.title,
        blurb: formData.blurb,
        content: formData.content,
        shortNovelGenre: formData.shortNovelGenre,
        readingPreview,
        contentRating: formData.contentRating,
        isShortNovel: true,
        isPublished: false,
      }

      const response = await fetch('/api/dashboard/short-novels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await safeParseJson(response)

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      alert(`Success! Short novel "${data.novel.title}" has been created!`)
      router.push('/dashboard/novels')
    } catch (error: any) {
      console.error('Upload error:', error)
      alert('Error: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Novel Details (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Zap className="text-amber-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Short Novel Details</h2>
          </div>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-2">(max 80 characters)</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= SHORT_NOVEL_LIMITS.TITLE_MAX) {
                    setFormData({ ...formData, title: value })
                  }
                }}
                placeholder="Enter a catchy title for your short novel"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-lg font-medium ${
                  titleError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-amber-500'
                }`}
                maxLength={SHORT_NOVEL_LIMITS.TITLE_MAX}
              />
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${titleCharCount > 70 ? 'text-amber-600' : 'text-gray-500'}`}>
                  {titleCharCount} / {SHORT_NOVEL_LIMITS.TITLE_MAX}
                </span>
                {titleError && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Title too long
                  </span>
                )}
              </div>
            </div>

            {/* Genre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SHORT_NOVEL_GENRES.map((genre) => (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, shortNovelGenre: genre.id })}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                      formData.shortNovelGenre === genre.id
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Blurb */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blurb <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-2">(shown in listings)</span>
              </label>
              <textarea
                required
                value={formData.blurb}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= 1000) {
                    setFormData({ ...formData, blurb: value })
                  }
                }}
                rows={4}
                placeholder="Write a compelling blurb to attract readers..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                maxLength={1000}
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-500">
                  {blurbCharCount} / 1000
                </span>
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Story Content <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-2">
                  ({SHORT_NOVEL_LIMITS.MIN_CHARACTERS.toLocaleString()} - {SHORT_NOVEL_LIMITS.MAX_CHARACTERS.toLocaleString()} characters)
                </span>
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={20}
                placeholder="Write your complete short novel here..."
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent font-serif text-base leading-relaxed ${
                  !contentValidation.valid && contentCharCount > 0
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-amber-500'
                }`}
              />
              <div className="flex justify-between mt-2">
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-medium ${
                    contentValidation.valid ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {contentCharCount.toLocaleString()} characters
                  </span>
                  {contentCharCount > 0 && (
                    <span className="text-sm text-gray-500">
                      ~{formatReadingTime(readingTime)}
                    </span>
                  )}
                </div>
                {!contentValidation.valid && contentCharCount > 0 && (
                  <span className="text-sm text-red-600">
                    {contentValidation.message}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      contentCharCount < SHORT_NOVEL_LIMITS.MIN_CHARACTERS
                        ? 'bg-amber-400'
                        : contentCharCount > SHORT_NOVEL_LIMITS.MAX_CHARACTERS
                        ? 'bg-red-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (contentCharCount / SHORT_NOVEL_LIMITS.MAX_CHARACTERS) * 100)}%`
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>Min: {SHORT_NOVEL_LIMITS.MIN_CHARACTERS.toLocaleString()}</span>
                  <span>Max: {SHORT_NOVEL_LIMITS.MAX_CHARACTERS.toLocaleString()}</span>
                </div>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
          </div>
        </div>
      </div>

      {/* Right Column - Action Button (1/3 width) */}
      <div className="lg:col-span-1 space-y-6">
        {/* Info Note */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
          <div className="text-center py-6 mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mb-4">
              <Zap size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Short Novel</h3>
            <p className="text-sm text-gray-600 mb-4">
              Quick reads perfect for one sitting
            </p>
            <div className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-4 text-left space-y-2">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                No cover image needed
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                One complete story
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                10-30 minute read time
              </p>
            </div>
          </div>

          {/* Validation Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Title</span>
              <span className={formData.title.length > 0 && !titleError ? 'text-green-600' : 'text-gray-400'}>
                {formData.title.length > 0 && !titleError ? '✓' : '○'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Genre</span>
              <span className={formData.shortNovelGenre ? 'text-green-600' : 'text-gray-400'}>
                {formData.shortNovelGenre ? '✓' : '○'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Blurb</span>
              <span className={formData.blurb.length > 0 ? 'text-green-600' : 'text-gray-400'}>
                {formData.blurb.length > 0 ? '✓' : '○'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Content</span>
              <span className={contentValidation.valid ? 'text-green-600' : 'text-gray-400'}>
                {contentValidation.valid ? '✓' : '○'}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={uploading || !contentValidation.valid}
            className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all text-lg shadow-md hover:shadow-lg"
          >
            {uploading ? 'Creating...' : 'Create Short Novel'}
          </button>
        </div>
      </div>
    </form>
  )
}
