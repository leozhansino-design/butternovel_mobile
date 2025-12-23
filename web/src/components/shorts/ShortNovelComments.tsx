'use client'

import { useState, useEffect } from 'react'

interface Rating {
  id: string
  score: number
  review: string | null
  createdAt: Date
  user: {
    id: string
    name: string | null
    avatar: string | null
  }
}

interface ShortNovelCommentsProps {
  novelId: number
  initialRatings: Rating[]
  onRatingAdded?: () => void
}

export default function ShortNovelComments({
  novelId,
  initialRatings,
  onRatingAdded,
}: ShortNovelCommentsProps) {
  const [ratings, setRatings] = useState<Rating[]>(initialRatings)
  const [newRating, setNewRating] = useState(0)
  const [newReview, setNewReview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userRating, setUserRating] = useState<Rating | null>(null)
  const [hoverRating, setHoverRating] = useState(0)
  const [isCheckingRating, setIsCheckingRating] = useState(true)

  // Check if user has already rated
  useEffect(() => {
    const checkUserRating = async () => {
      setIsCheckingRating(true)
      try {
        const response = await fetch(`/api/novels/${novelId}/user-rating`)
        const data = await response.json()
        if (data.rating) {
          setUserRating(data.rating)
          setNewRating(data.rating.score)
        }
      } catch (error) {
        console.error('Failed to check user rating:', error)
      } finally {
        setIsCheckingRating(false)
      }
    }
    checkUserRating()
  }, [novelId])

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newRating === 0) {
      alert('Please select a rating')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/novels/${novelId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: newRating,
          review: newReview || null,
        }),
      })

      const data = await response.json()

      // Handle different response statuses
      if (response.status === 401) {
        alert('Please sign in to rate this story')
        return
      }

      if (response.status === 409) {
        alert('You have already rated this story')
        // Try to refresh to get their existing rating
        const userRatingRes = await fetch(`/api/novels/${novelId}/user-rating`)
        const userRatingData = await userRatingRes.json()
        if (userRatingData.success && userRatingData.rating) {
          setUserRating(userRatingData.rating)
        }
        return
      }

      if (response.ok && data.rating) {
        setUserRating(data.rating)
        setNewReview('')
        // Refresh ratings list
        const ratingsRes = await fetch(`/api/novels/${novelId}/ratings`)
        const ratingsData = await ratingsRes.json()
        if (ratingsData.success) {
          setRatings(ratingsData.ratings)
        }
        // 通知父组件评分数量增加
        onRatingAdded?.()
      } else {
        alert(data.error || 'Failed to submit rating. Please try again.')
      }
    } catch (error) {
      console.error('Failed to submit rating:', error)
      alert('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const renderStars = (score: number, interactive = false, size = 'w-5 h-5') => {
    const stars = []
    const displayScore = interactive ? (hoverRating || newRating) : score

    for (let i = 2; i <= 10; i += 2) {
      const filled = displayScore >= i
      const halfFilled = displayScore >= i - 1 && displayScore < i

      stars.push(
        <button
          key={i}
          type={interactive ? 'button' : undefined}
          onClick={interactive ? () => setNewRating(i) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(i) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          className={interactive ? 'focus:outline-none' : ''}
          disabled={!interactive}
        >
          <svg
            className={`${size} ${filled ? 'text-yellow-500' : halfFilled ? 'text-yellow-300' : 'text-gray-300'} ${
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      )
    }

    return <div className="flex items-center gap-0.5">{stars}</div>
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Ratings & Reviews</h3>

      {/* Rating Form */}
      {isCheckingRating ? (
        <div className="bg-gray-50 rounded-xl p-5 flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Loading...</div>
        </div>
      ) : !userRating ? (
        <form onSubmit={handleSubmitRating} className="bg-gray-50 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating
            </label>
            <div className="flex items-center gap-2">
              {renderStars(0, true, 'w-7 h-7')}
              {newRating > 0 && (
                <span className="text-sm text-gray-500 ml-2">
                  {newRating / 2} / 5
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review (optional)
            </label>
            <textarea
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Share your thoughts about this story..."
              maxLength={1000}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || newRating === 0}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </form>
      ) : (
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-blue-700">Your Rating:</span>
            {renderStars(userRating.score, false, 'w-4 h-4')}
            <span className="text-sm text-blue-600">({userRating.score / 2}/5)</span>
          </div>
          {userRating.review && (
            <p className="text-sm text-gray-600">{userRating.review}</p>
          )}
        </div>
      )}

      {/* Ratings List */}
      <div className="space-y-4">
        {ratings.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No reviews yet. Be the first to share your thoughts!
          </p>
        ) : (
          ratings.map((rating) => (
            <div key={rating.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                  {rating.user.avatar ? (
                    <img
                      src={rating.user.avatar}
                      alt={rating.user.name || 'User'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide broken image and show initial
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : null}
                  <span className={rating.user.avatar ? 'hidden' : ''}>
                    {(rating.user.name || 'U')[0].toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">
                      {rating.user.name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(rating.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(rating.score, false, 'w-4 h-4')}
                    <span className="text-sm text-gray-500">
                      {rating.score / 2}/5
                    </span>
                  </div>

                  {rating.review && (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {rating.review}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
