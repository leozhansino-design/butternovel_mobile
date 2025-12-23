// src/components/LazyAnalytics.tsx
// ⚡ Performance: Defer analytics loading until after page is interactive
// This prevents analytics from blocking the initial page render

'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Lazy load analytics components
const Analytics = dynamic(
  () => import('@vercel/analytics/react').then(mod => mod.Analytics),
  { ssr: false }
)

const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then(mod => mod.SpeedInsights),
  { ssr: false }
)

export default function LazyAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    // Wait for the page to be interactive before loading analytics
    // Use requestIdleCallback for best performance, fallback to setTimeout
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(
        () => setShouldLoad(true),
        { timeout: 3000 } // Load within 3 seconds even if busy
      )
      return () => window.cancelIdleCallback(id)
    } else {
      // Fallback: load after a short delay
      const timer = setTimeout(() => setShouldLoad(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!shouldLoad) {
    return null
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
