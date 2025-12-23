// src/components/ViewTracker.tsx
'use client'

import { useEffect, useRef } from 'react'

interface ViewTrackerProps {
  novelId: number
}

export default function ViewTracker({ novelId }: ViewTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return

    const trackView = async () => {
      try {
        await fetch('/api/views/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ novelId })
        })
        tracked.current = true
      } catch (error) {
        console.error('❌ Failed to track view:', error)
      }
    }

    const timer = setTimeout(trackView, 3000)
    return () => clearTimeout(timer)
  }, [novelId])

  return null
}