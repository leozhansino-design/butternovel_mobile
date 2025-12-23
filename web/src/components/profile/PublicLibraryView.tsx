'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type NovelInLibrary = {
  id: number
  title: string
  slug: string
  coverImage: string
  category: string
  status: 'ONGOING' | 'COMPLETED'
  totalChapters: number
  addedAt: string
}

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

interface PublicLibraryViewProps {
  userId: string
}

export default function PublicLibraryView({ userId }: PublicLibraryViewProps) {
  const [novels, setNovels] = useState<NovelInLibrary[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  })
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchLibrary = async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const res = await fetch(`/api/public/user/${userId}/library?page=${page}&limit=20`)
      const data = await res.json()

      if (res.ok) {
        if (append) {
          setNovels(prev => [...prev, ...(data.novels || [])])
        } else {
          setNovels(data.novels || [])
        }
        setPagination(data.pagination || pagination)
      }
    } catch (error) {
      console.error('Failed to fetch library:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchLibrary(1, false)
  }, [userId])

  const handleLoadMore = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchLibrary(pagination.page + 1, true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (novels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <svg
          className="w-20 h-20 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <p className="text-gray-600 text-lg font-medium mb-2">No novels in library</p>
        <p className="text-gray-500 text-sm">
          This user hasn't added any novels to their library yet
        </p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {novels.map((novel) => (
          <Link
            key={novel.id}
            href={`/novels/${novel.slug}`}
            className="group"
          >
            <div className="relative bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              {/* Cover Image */}
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                <Image
                  src={novel.coverImage}
                  alt={novel.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Novel Info */}
              <div className="p-3">
                <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                  {novel.title}
                </h3>

                {/* Category and chapters */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="text-amber-600">{novel.category}</span>
                  <span>{novel.totalChapters} chapters</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Load More Button */}
      {pagination.hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </span>
            ) : (
              `Load More (${pagination.total - novels.length} remaining)`
            )}
          </button>
        </div>
      )}

      {/* Pagination Info */}
      {pagination.total > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {novels.length} of {pagination.total} novels
        </div>
      )}
    </div>
  )
}
