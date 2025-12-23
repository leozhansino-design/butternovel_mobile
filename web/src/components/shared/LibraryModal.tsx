// src/components/shared/LibraryModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import MyLibrary from '@/components/library/MyLibrary'
import ProfileView from '@/components/library/ProfileView'
import ReadingHistory from '@/components/library/ReadingHistory'
import WorksTab from '@/components/library/WorksTab'
import RatingsTab from '@/components/profile/RatingsTab'
import PublicUserProfile from '@/components/profile/PublicUserProfile'

interface LibraryModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  defaultView?: 'profile' | 'library' | 'history' | 'novels' | 'reviews'
  viewUserId?: string // Optional: View another user's profile
}

export default function LibraryModal({ isOpen, onClose, user, defaultView = 'library', viewUserId }: LibraryModalProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'novels' | 'library' | 'history' | 'reviews'>(
    defaultView === 'history' ? 'history' :
    defaultView === 'novels' ? 'novels' :
    defaultView === 'reviews' ? 'reviews' :
    'library'
  )
  const [otherUserData, setOtherUserData] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(false)

  // Check if viewing another user's profile
  const isViewingOtherUser = viewUserId && viewUserId !== session?.user?.id

  // Fetch other user's data if viewing another user
  useEffect(() => {
    if (isOpen && isViewingOtherUser) {
      const fetchUserData = async () => {
        try {
          setLoadingUser(true)
          const res = await fetch(`/api/user/${viewUserId}`)
          const data = await res.json()
          if (res.ok && data.success) {
            setOtherUserData(data.data)
          } else {
            console.error('[LibraryModal] Failed to load user:', { ok: res.ok, success: data.success, data })
          }
        } catch (error) {
          console.error('[LibraryModal] Failed to fetch user data:', error)
        } finally {
          setLoadingUser(false)
        }
      }
      fetchUserData()
    }
  }, [isOpen, isViewingOtherUser, viewUserId])

  // 当 defaultView 改变时更新视图
  useEffect(() => {
    if (isOpen) {
      if (defaultView === 'history') {
        setActiveTab('history')
      } else if (defaultView === 'novels') {
        setActiveTab('novels')
      } else if (defaultView === 'reviews') {
        setActiveTab('reviews')
      } else {
        setActiveTab('library')
      }
    }
  }, [isOpen, defaultView])

  // 防止背景滚动 - Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // 保存原始的 overflow 值
      const originalOverflow = document.body.style.overflow
      const originalPaddingRight = document.body.style.paddingRight

      // 计算滚动条宽度，防止内容抖动
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

      // 锁定滚动
      document.body.style.overflow = 'hidden'
      // 如果有滚动条，添加 padding 防止内容位移
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }

      // 清理函数：modal 关闭时恢复滚动
      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight
      }
    }
  }, [isOpen])

  // Shared handler for novel clicks - close modal first, then navigate
  const handleNovelClick = (slug: string) => {
    // Close modal first, then navigate
    onClose()
    // Small delay to allow modal close animation
    setTimeout(() => {
      window.location.href = `/novels/${slug}`
    }, 100)
  }

  if (!isOpen) return null

  // If viewing another user, show simplified version with only profile and reviews
  if (isViewingOtherUser) {
    if (loadingUser) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-md" onClick={onClose} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        </div>
      )
    }

    if (!otherUserData) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-md" onClick={onClose} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-12">
            <p>User not found</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg">Close</button>
          </div>
        </div>
      )
    }

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-md" onClick={onClose} />
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 sm:rounded-3xl shadow-2xl w-full sm:w-[95vw] max-w-7xl h-full sm:h-[90vh] overflow-auto">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-2.5 hover:bg-white/80 rounded-full transition-all bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <PublicUserProfile user={otherUserData} onNovelClick={handleNovelClick} />
        </div>
      </div>
    )
  }

  // Otherwise, show normal library modal for current user
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop - 模糊背景 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal - 全新布局 */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 sm:rounded-3xl shadow-2xl w-full sm:w-[95vw] max-w-7xl h-full sm:h-[90vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2.5 hover:bg-white/80 rounded-full transition-all bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 顶部 - Profile 卡片 (毛玻璃效果) - 移动端优化 */}
        <div className="flex-shrink-0 p-3 sm:p-6 pb-0">
          <ProfileView user={user} />
        </div>

        {/* 中间 - Tab 导航栏 - 移动端优化 */}
        <div className="flex-shrink-0 px-3 sm:px-6 pt-3 sm:pt-4">
          <div className="bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-2 sm:p-4">
            <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('novels')}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'novels'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                }`}
              >
                Novels
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'library'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                }`}
              >
                Library
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'reviews'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                }`}
              >
                Reviews
              </button>
            </div>
          </div>
        </div>

        {/* 底部 - Tab 内容 - 移动端优化 */}
        <div className="flex-1 overflow-hidden px-3 sm:px-6 pt-3 sm:pt-4 pb-3 sm:pb-6">
          <div className="h-full bg-white/40 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 overflow-hidden">
            {activeTab === 'novels' && <WorksTab onClose={onClose} />}
            {activeTab === 'library' && <MyLibrary onClose={onClose} />}
            {activeTab === 'history' && <ReadingHistory onClose={onClose} />}
            {activeTab === 'reviews' && <RatingsTab onNovelClick={handleNovelClick} />}
          </div>
        </div>
      </div>
    </div>
  )
}
