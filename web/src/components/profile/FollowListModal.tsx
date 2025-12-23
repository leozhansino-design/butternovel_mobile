'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import UserBadge from '@/components/badge/UserBadge'
import { getUserLevel } from '@/lib/badge-system'
import LibraryModal from '@/components/shared/LibraryModal'

type User = {
  id: string
  name: string | null
  avatar: string | null
  bio: string | null
  level: number
  contributionPoints: number
  isOfficial?: boolean  // Official account flag
}

interface FollowListModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  type: 'following' | 'followers'
  onUserClick?: (userId: string) => void
}

export default function FollowListModal({
  isOpen,
  onClose,
  userId,
  type,
  onUserClick
}: FollowListModalProps) {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [unfollowingUserId, setUnfollowingUserId] = useState<string | null>(null)

  // Library Modal state for viewing user profiles
  const [showLibraryModal, setShowLibraryModal] = useState(false)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)

  // Check if this is current user's own list
  const isOwnList = session?.user?.id === userId

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen, userId, type])

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

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const endpoint = type === 'following'
        ? `/api/user/${userId}/following`
        : `/api/user/${userId}/followers`

      const res = await fetch(endpoint)
      const data = await res.json()

      if (res.ok) {
        setUsers(data[type] || [])
      }
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = (clickedUserId: string) => {
    setViewingUserId(clickedUserId)
    setShowLibraryModal(true)
  }

  const handleUnfollow = async (targetUserId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening profile modal

    if (!isOwnList) return

    setUnfollowingUserId(targetUserId)

    try {
      const res = await fetch('/api/user/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId })
      })

      if (res.ok) {
        // Remove user from list
        setUsers(prev => prev.filter(u => u.id !== targetUserId))
      } else {
        const data = await res.json()
        console.error('[FollowListModal] Failed to unfollow:', data)
        alert(data.error || 'Failed to unfollow user')
      }
    } catch (error) {
      console.error('Failed to unfollow user:', error)
      alert('Failed to unfollow user')
    } finally {
      setUnfollowingUserId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {type === 'following' ? 'Following' : 'Followers'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No {type === 'following' ? 'following' : 'followers'} yet
            </div>
          ) : (
            <div className="space-y-4">
              {users.map(user => {
                const levelData = getUserLevel(user.contributionPoints)
                const isUnfollowing = unfollowingUserId === user.id
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {/* Clickable user info */}
                    <button
                      onClick={() => handleUserClick(user.id)}
                      className="flex items-center gap-4 flex-1 min-w-0 text-left"
                    >
                      <UserBadge
                        avatar={user.avatar}
                        name={user.name}
                        level={user.level}
                        contributionPoints={user.contributionPoints}
                        size="medium"
                        showLevelName={false}
                        isOfficial={user.isOfficial}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {user.name || 'Anonymous Reader'}
                        </div>
                        <div className={`text-xs font-medium ${user.isOfficial ? 'text-blue-600' : 'text-amber-600'}`}>
                          {user.isOfficial ? 'Official' : levelData.nameEn}
                        </div>
                        {user.bio && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </button>

                    {/* Unfollow button - only show on own following list */}
                    {isOwnList && type === 'following' && (
                      <button
                        onClick={(e) => handleUnfollow(user.id, e)}
                        disabled={isUnfollowing}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {isUnfollowing ? 'Unfollowing...' : 'Unfollow'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Library Modal for viewing user profiles */}
      {viewingUserId && (
        <LibraryModal
          isOpen={showLibraryModal}
          onClose={() => {
            setShowLibraryModal(false)
            setViewingUserId(null)
          }}
          user={session?.user || {}}
          viewUserId={viewingUserId}
        />
      )}
    </div>
  )
}
