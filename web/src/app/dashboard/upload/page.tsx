'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import NovelUploadForm from '@/components/dashboard/NovelUploadForm'
import ShortNovelUploadForm from '@/components/dashboard/ShortNovelUploadForm'
import { ArrowLeft, BookOpen, Zap } from 'lucide-react'
import Link from 'next/link'

type NovelType = 'regular' | 'short' | null

export default function UploadPage() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type')

  const [novelType, setNovelType] = useState<NovelType>(null)

  // Set initial type from URL parameter
  useEffect(() => {
    if (typeParam === 'short' || typeParam === 'regular') {
      setNovelType(typeParam)
    }
  }, [typeParam])

  // Show type selection if not selected
  if (!novelType) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <Link
              href="/dashboard/novels"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Stories
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New Story</h1>
            <p className="text-sm text-gray-500 mt-1">Choose the type of story you want to create</p>
          </div>
        </div>

        {/* Type Selection */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Regular Novel */}
            <button
              onClick={() => setNovelType('regular')}
              className="group relative bg-white rounded-2xl border-2 border-gray-200 p-8 text-left hover:border-indigo-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Regular Novel</h3>
              <p className="text-gray-500 mb-4">
                Multi-chapter stories with cover image. Perfect for serialized novels, ongoing stories, and longer works.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Multiple chapters
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Cover image required
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Ongoing or completed
                </li>
              </ul>
              <div className="absolute top-4 right-4">
                <svg className="w-6 h-6 text-gray-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Short Novel */}
            <button
              onClick={() => setNovelType('short')}
              className="group relative bg-white rounded-2xl border-2 border-gray-200 p-8 text-left hover:border-amber-500 hover:shadow-lg transition-all"
            >
              <div className="absolute top-4 right-4 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                NEW
              </div>
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mb-6 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Short Novel</h3>
              <p className="text-gray-500 mb-4">
                Quick reads in 10-30 minutes. One-shot stories without cover image. Perfect for one-sitting reads.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  15,000 - 50,000 characters
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  No cover image needed
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Quick 10-30 min reads
                </li>
              </ul>
              <div className="absolute bottom-4 right-4">
                <svg className="w-6 h-6 text-gray-300 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show appropriate form based on selection
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => setNovelType(null)}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Change Story Type
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Create New {novelType === 'short' ? 'Short Novel' : 'Story'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {novelType === 'short'
              ? 'Write a quick read (10-30 minutes) without needing a cover image'
              : 'Fill in the details below to create your story'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {novelType === 'short' ? <ShortNovelUploadForm /> : <NovelUploadForm />}
      </div>
    </div>
  )
}
