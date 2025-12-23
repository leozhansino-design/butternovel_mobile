'use client'
// src/components/novel/TableOfContents.tsx
// Table of contents component - elegant design

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

type Chapter = {
  id: number
  chapterNumber: number
  title: string
  createdAt: Date
  wordCount: number
}

type TableOfContentsProps = {
  chapters: Chapter[]
  novelSlug: string
}

const CHAPTERS_PER_PAGE = 30 // 30 chapters per page

export default function TableOfContents({ chapters, novelSlug }: TableOfContentsProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(chapters.length / CHAPTERS_PER_PAGE)
  const startIndex = (currentPage - 1) * CHAPTERS_PER_PAGE
  const endIndex = startIndex + CHAPTERS_PER_PAGE
  const currentChapters = chapters.slice(startIndex, endIndex)

  // Layout based on chapter count: few use large style, many use 3 columns
  const isCompactLayout = chapters.length > 10
  const gridCols = isCompactLayout ? 'md:grid-cols-3' : 'md:grid-cols-2'

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Table of Contents
            </h2>
            <p className="text-gray-500">
              {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}
            </p>
          </div>

          {/* Chapter list */}
          <div className={`grid grid-cols-1 ${gridCols} gap-4 mb-12`}>
            {currentChapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/novels/${novelSlug}/chapters/${chapter.chapterNumber}`}
                className="group block p-5 border border-gray-200 rounded-lg hover:border-gray-900 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Chapter number */}
                    <div className="text-xs font-medium text-gray-500 mb-1.5">
                      CH {chapter.chapterNumber}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 mb-2 line-clamp-2 leading-snug">
                      {chapter.title}
                    </h3>

                    {/* Meta information */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatDistanceToNow(new Date(chapter.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Arrow icon */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`
                      w-10 h-10 rounded-lg font-medium transition-colors
                      ${currentPage === page
                        ? 'bg-gray-900 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
