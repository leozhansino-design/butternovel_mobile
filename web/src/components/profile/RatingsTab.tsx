'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface RatingsTabProps {
  userId?: string // 可选：查询指定用户的评分
  onNovelClick?: (slug: string) => void // 可选：点击小说时的回调
}

type Rating = {
  id: string
  score: number
  review: string | null
  likeCount: number
  createdAt: string
  novel: {
    id: number
    title: string
    slug: string
    coverImage: string
    authorName: string
    category: {
      name: string
    }
  }
}

export default function RatingsTab({ userId, onNovelClick }: RatingsTabProps = {}) {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchRatings()
  }, [page, userId])

  const fetchRatings = async () => {
    try {
      setLoading(true)
      const userIdParam = userId ? `&userId=${userId}` : ''
      const res = await fetch(`/api/profile/ratings?page=${page}&limit=10${userIdParam}`)
      const response = await res.json()

      if (res.ok && response.success) {
        // API返回格式: { success: true, data: { ratings: [...], pagination: {...} } }
        setRatings(response.data?.ratings || [])
        setTotalPages(response.data?.pagination?.totalPages || 1)
      } else {
        console.error('Failed to fetch ratings:', response.error)
        setRatings([])
      }
    } catch (error) {
      console.error('Failed to fetch ratings:', error)
      setRatings([])
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (score: number) => {
    const stars = score / 2 // 转换为5星制
    const fullStars = Math.floor(stars)
    const hasHalfStar = stars % 1 !== 0

    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-5 h-5 ${
              i < fullStars
                ? 'text-yellow-400 fill-current'
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
            fill={i < fullStars ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        ))}
        <span className="ml-2 text-sm font-medium text-gray-600">
          {score}/10
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (ratings.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
        <p className="text-gray-500 text-lg">No reviews yet</p>
        <p className="text-gray-400 text-sm mt-2">Read some novels and rate them!</p>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-6">
        {ratings.map((rating) => (
          <div
            key={rating.id}
            className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
          >
            <div className="flex gap-4">
              {/* 小说封面 */}
              {onNovelClick ? (
                <div
                  onClick={() => onNovelClick(rating.novel.slug)}
                  className="flex-shrink-0 group cursor-pointer"
                >
                  <div className="relative w-24 h-32 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
                    <Image
                      src={rating.novel.coverImage}
                      alt={rating.novel.title}
                      fill
                      className="object-cover group-hover:brightness-110 transition-all"
                    />
                    {/* Overlay on hover - pointer-events-none to allow clicks */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all pointer-events-none" />
                  </div>
                </div>
              ) : (
                <Link href={`/novels/${rating.novel.slug}`} className="flex-shrink-0 group">
                  <div className="relative w-24 h-32 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all duration-200 cursor-pointer">
                    <Image
                      src={rating.novel.coverImage}
                      alt={rating.novel.title}
                      fill
                      className="object-cover group-hover:brightness-110 transition-all"
                    />
                    {/* Overlay on hover - pointer-events-none to allow clicks */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all pointer-events-none" />
                  </div>
                </Link>
              )}

              {/* 评分信息 */}
              <div className="flex-1 min-w-0">
                {onNovelClick ? (
                  <h3
                    onClick={() => onNovelClick(rating.novel.slug)}
                    className="text-lg font-bold text-gray-900 hover:text-amber-600 transition-colors line-clamp-1 cursor-pointer"
                  >
                    {rating.novel.title}
                  </h3>
                ) : (
                  <Link
                    href={`/novels/${rating.novel.slug}`}
                    className="text-lg font-bold text-gray-900 hover:text-amber-600 transition-colors line-clamp-1 cursor-pointer"
                  >
                    {rating.novel.title}
                  </Link>
                )}

                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                  <span>{rating.novel.authorName}</span>
                  <span>•</span>
                  <span className="text-amber-600">{rating.novel.category.name}</span>
                </div>

                {/* 星级评分 */}
                <div className="mt-3">{renderStars(rating.score)}</div>

                {/* 评论内容 */}
                {rating.review && (
                  <div className="mt-3 bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{rating.review}</p>
                  </div>
                )}

                {/* 点赞数和时间 */}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    <span>{rating.likeCount}</span>
                  </div>
                  <span>•</span>
                  <span>{new Date(rating.createdAt).toLocaleDateString('en-US')}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
