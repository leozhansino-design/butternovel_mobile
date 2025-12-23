'use client'
// src/components/novel/ClientRatingDisplay.tsx
// Rating display with client-side session fetching

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import RatingDisplay from './RatingDisplay'

interface ClientRatingDisplayProps {
  novelId: number
  averageRating: number
  totalRatings: number
  compact?: boolean  // 移动端紧凑模式
}

export default function ClientRatingDisplay({
  novelId,
  averageRating,
  totalRatings,
  compact = false
}: ClientRatingDisplayProps) {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [userRating, setUserRating] = useState<number | undefined>(undefined)
  const [hasUserRated, setHasUserRated] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check URL params for auto-opening rating modal
  const openRatingId = searchParams.get('openRating')
  const openRatings = searchParams.get('openRatings') === 'true'
  const shouldAutoOpen = !!openRatingId || openRatings

  // Fetch user's rating from API if logged in
  useEffect(() => {
    if (session?.user?.id) {
      setLoading(true)
      fetch(`/api/novels/${novelId}/rating/check`)
        .then(res => res.json())
        .then(data => {
          if (data.rating) {
            setUserRating(data.rating.score)
            setHasUserRated(true)
          }
        })
        .catch(error => {
          console.error('Failed to fetch user rating:', error)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [session?.user?.id, novelId])

  return (
    <RatingDisplay
      novelId={novelId}
      averageRating={averageRating}
      totalRatings={totalRatings}
      userId={session?.user?.id}
      hasUserRated={hasUserRated}
      userRatingScore={userRating}
      autoOpen={shouldAutoOpen}
      highlightRatingId={openRatingId || undefined}
      compact={compact}
    />
  )
}
