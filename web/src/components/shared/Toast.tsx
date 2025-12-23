'use client'

import { useEffect, useRef } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  isVisible: boolean
  onClose: () => void
}

export default function Toast({ message, type = 'success', isVisible, onClose }: ToastProps) {
  // ✅ 使用 ref 保存最新的 onClose，避免不必要的 effect 重新运行
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onCloseRef.current()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className={`
        px-6 py-3 rounded-lg shadow-lg flex items-center gap-3
        ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
      `}>
        {type === 'success' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  )
}