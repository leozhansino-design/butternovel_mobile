'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Toast from '@/components/shared/Toast'

interface AddToLibraryButtonProps {
  novelId: number
  userId?: string
  compact?: boolean  // 移动端紧凑模式
}

export default function AddToLibraryButton({ novelId, userId, compact = false }: AddToLibraryButtonProps) {
  const pathname = usePathname()
  const [isInLibrary, setIsInLibrary] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' })

  const checkLibraryStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/library/check?novelId=${novelId}`)
      const data = await res.json()
      setIsInLibrary(data.isInLibrary)
    } catch (error) {
      console.error('Failed to check library status:', error)
    }
  }, [novelId])  // FIX: Use useCallback to avoid infinite loop

  useEffect(() => {
    if (userId) {
      checkLibraryStatus()
    }
  }, [userId, checkLibraryStatus])  // FIX: Add correct dependencies

  const handleClick = async () => {
    if (!userId) {
      // Redirect to login with current page URL
      signIn('google', { callbackUrl: window.location.href })
      return
    }

    setLoading(true)

    try {
      const method = isInLibrary ? 'DELETE' : 'POST'
      const res = await fetch('/api/library', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId })
      })

      if (res.ok) {
        const newStatus = !isInLibrary
        setIsInLibrary(newStatus)
        
        setToast({
          show: true,
          message: newStatus ? 'Added to Library' : 'Removed from Library',
          type: 'success'
        })
      } else {
        setToast({
          show: true,
          message: 'Failed to update library',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Failed to update library:', error)
      setToast({
        show: true,
        message: 'Something went wrong',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <button
        onClick={handleClick}
        disabled={loading}
        className={`
          group relative transition-all duration-300 overflow-hidden cursor-pointer
          ${compact
            ? 'p-3 rounded-lg'
            : 'p-4 rounded-xl'
          }
          ${isInLibrary
            ? 'bg-blue-50 backdrop-blur-sm border-2 border-blue-200'
            : 'bg-white backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300'
          }
          shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={isInLibrary ? 'Remove from Library' : 'Add to Library'}
        aria-label="Add to Library"
      >
        <svg
          className={`
            ${compact ? 'w-5 h-5' : 'w-6 h-6'} transition-all duration-300 relative z-10
            ${isInLibrary
              ? 'text-blue-600'
              : 'text-gray-400 group-hover:text-blue-600'
            }
            group-hover:scale-110
            ${loading ? 'animate-pulse' : ''}
          `}
          fill={isInLibrary ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>

        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-all duration-300" />
      </button>
    </>
  )
}