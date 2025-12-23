// src/components/auth/Turnstile.tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: TurnstileOptions
      ) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

interface TurnstileOptions {
  sitekey: string
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
}

interface TurnstileProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
  className?: string
}

// Global flag to track if script is being loaded
let isScriptLoading = false
let isScriptLoaded = false

export default function Turnstile({
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  size = 'normal',
  className = '',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const isRenderedRef = useRef(false)

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  const renderWidget = useCallback(() => {
    // Multiple checks to prevent duplicate rendering
    if (!window.turnstile || !containerRef.current || !siteKey) return
    if (widgetIdRef.current) return // Already have a widget ID
    if (isRenderedRef.current) return // Already rendered flag
    if (containerRef.current.hasChildNodes()) return // Container already has children

    try {
      isRenderedRef.current = true
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        'expired-callback': onExpire,
        'error-callback': onError,
        theme,
        size,
      })
    } catch (error) {
      console.error('Turnstile render error:', error)
      isRenderedRef.current = false
    }
  }, [siteKey, onVerify, onExpire, onError, theme, size])

  useEffect(() => {
    // If Turnstile is disabled (no site key), skip loading
    if (!siteKey) {
      console.warn('Turnstile site key not configured, skipping verification')
      return
    }

    // Reset rendered flag when component mounts
    isRenderedRef.current = false

    // If script is already loaded, render immediately
    if (isScriptLoaded && window.turnstile) {
      renderWidget()
      return
    }

    // If script is loading, set up callback
    if (isScriptLoading) {
      const originalCallback = window.onTurnstileLoad
      window.onTurnstileLoad = () => {
        isScriptLoaded = true
        originalCallback?.()
        renderWidget()
      }
      return
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="turnstile"]')
    if (existingScript) {
      isScriptLoading = true
      const originalCallback = window.onTurnstileLoad
      window.onTurnstileLoad = () => {
        isScriptLoaded = true
        originalCallback?.()
        renderWidget()
      }
      return
    }

    // Load the script
    isScriptLoading = true
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
    script.async = true
    script.defer = true

    window.onTurnstileLoad = () => {
      isScriptLoaded = true
      isScriptLoading = false
      renderWidget()
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup widget on unmount
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch (e) {
          // Ignore cleanup errors
        }
        widgetIdRef.current = null
        isRenderedRef.current = false
      }
    }
  }, [siteKey, renderWidget])

  // Don't render anything if site key is not configured
  if (!siteKey) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`cf-turnstile ${className}`}
    />
  )
}
