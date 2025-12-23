// src/components/ReadingHistoryTracker.tsx
'use client'

import { useEffect, useRef } from 'react'

type ReadingHistoryTrackerProps = {
  novelId: number
  chapterId?: number
}

export default function ReadingHistoryTracker({ novelId, chapterId }: ReadingHistoryTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    // Only track once per page load
    if (tracked.current) return

    const trackReading = async () => {
      try {
        // If we have a chapterId, use reading-progress endpoint
        // Otherwise, just track novel visit
        if (chapterId) {
          await fetch('/api/reading-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novelId, chapterId })
          })
        } else {
          // For novel detail page without chapter, we need first chapter
          // Fetch first chapter to create reading history record
          const res = await fetch(`/api/novels/${novelId}/first-chapter`)
          const data = await res.json()

          if (res.ok && data.chapterId) {
            await fetch('/api/reading-progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ novelId, chapterId: data.chapterId })
            })
          }
        }

        tracked.current = true
      } catch (error) {
        // Silent fail - don't disrupt user experience
        console.error('Failed to track reading history:', error)
      }
    }

    // Track after a short delay to ensure user is actually viewing
    const timer = setTimeout(trackReading, 1000)

    return () => clearTimeout(timer)
  }, [novelId, chapterId])

  return null
}
