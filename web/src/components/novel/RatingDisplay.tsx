'use client'
// src/components/novel/RatingDisplay.tsx
// Rating display component (below cover)

import { useState, useEffect } from 'react'
import RatingModal from './RatingModal'
import { formatNumber } from '@/lib/format'

interface RatingDisplayProps {
  novelId: number
  averageRating: number
  totalRatings: number
  userId?: string
  hasUserRated?: boolean
  userRatingScore?: number
  autoOpen?: boolean
  highlightRatingId?: string
  compact?: boolean  // 移动端紧凑模式
}

export default function RatingDisplay({
  novelId,
  averageRating,
  totalRatings,
  userId,
  hasUserRated = false,
  userRatingScore,
  autoOpen = false,
  highlightRatingId,
  compact = false,
}: RatingDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Auto-open modal if requested via URL params
  useEffect(() => {
    if (autoOpen) {
      setIsModalOpen(true)
    }
  }, [autoOpen])

  // Always show novel's average rating stars
  const renderStars = (score: number) => {
    const starCount = score / 2 // Convert 2-10 to 1-5 stars
    const fullStars = Math.floor(starCount)
    const hasHalfStar = starCount % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    // Highlight stars on hover for users who haven't rated
    const color = (!hasUserRated && isHovered) ? '#FFA500' : '#FFB800'
    const emptyColor = (!hasUserRated && isHovered) ? '#FFD700' : '#E5E7EB'

    const starSize = compact ? 'w-4 h-4' : 'w-6 h-6'

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <svg
            key={`full-${i}`}
            className={`${starSize} transition-all ${!hasUserRated && isHovered ? 'scale-110' : ''}`}
            fill={color}
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg
            className={`${starSize} transition-all ${!hasUserRated && isHovered ? 'scale-110' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <defs>
              <linearGradient id={`half-star-${compact ? 'compact' : 'normal'}`}>
                <stop offset="50%" stopColor={color} />
                <stop offset="50%" stopColor={emptyColor} />
              </linearGradient>
            </defs>
            <path
              fill={`url(#half-star-${compact ? 'compact' : 'normal'})`}
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            />
          </svg>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <svg
            key={`empty-${i}`}
            className={`${starSize} transition-all ${!hasUserRated && isHovered ? 'scale-110' : ''}`}
            fill={emptyColor}
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
    )
  }

  // 紧凑模式：单行显示星星和评分
  if (compact) {
    return (
      <>
        <div
          className="flex items-center justify-center gap-1.5 cursor-pointer"
          onClick={() => setIsModalOpen(true)}
          onMouseEnter={() => !hasUserRated && setIsHovered(true)}
          onMouseLeave={() => !hasUserRated && setIsHovered(false)}
        >
          {renderStars(averageRating)}
          <span className="text-sm font-bold text-gray-900">
            {totalRatings > 0 ? averageRating.toFixed(1) : '-'}
          </span>
        </div>

        <RatingModal
          novelId={novelId}
          averageRating={averageRating}
          totalRatings={totalRatings}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          userId={userId}
          highlightRatingId={highlightRatingId}
        />
      </>
    )
  }

  return (
    <>
      <div className="mt-4">
        <div className="text-center">
          {/* Star area: always show average rating, hover effect for unrated users */}
          <div
            className="flex items-center justify-center gap-1 mb-2 cursor-pointer transition-transform hover:scale-[1.05] active:scale-[0.98]"
            onMouseEnter={() => !hasUserRated && setIsHovered(true)}
            onMouseLeave={() => !hasUserRated && setIsHovered(false)}
            onClick={() => setIsModalOpen(true)}
          >
            {renderStars(averageRating)}
          </div>

          {/* Rating number and statistics */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {totalRatings > 0 ? averageRating.toFixed(1) : '-'}
            </span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm text-gray-500 hover:text-amber-700 hover:underline transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              {totalRatings > 0
                ? `${formatNumber(totalRatings)} ${totalRatings === 1 ? 'rating' : 'ratings'}`
                : 'No ratings yet'
              }
            </button>
          </div>
        </div>
      </div>

      <RatingModal
        novelId={novelId}
        averageRating={averageRating}
        totalRatings={totalRatings}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        highlightRatingId={highlightRatingId}
      />
    </>
  )
}
