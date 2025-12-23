'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Novel = {
  id: number
  title: string
  slug: string
  coverImage: string
  authorName: string
  status: string
  totalChapters: number
  categoryName: string
  lastReadAt: string
}

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

interface PublicReadingHistoryProps {
  userId: string
}

export default function PublicReadingHistory({ userId }: PublicReadingHistoryProps) {
  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  })
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchHistory = async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const res = await fetch(`/api/public/user/${userId}/history?page=${page}&limit=20`)
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
      console.error('Failed to fetch reading history:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchHistory(1, false)
  }, [userId])

  const handleLoadMore = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchHistory(pagination.page + 1, true)
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-gray-600 text-lg font-medium mb-2">No reading history</p>
        <p className="text-gray-500 text-sm">
          This user hasn't read any novels yet
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
                <img
                  src={novel.coverImage}
                  alt={novel.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Novel Info */}
              <div className="p-3">
                <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                  {novel.title}
                </h3>

                {/* Category and chapters */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="text-amber-600">{novel.categoryName}</span>
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
