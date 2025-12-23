'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import UserBadge from '@/components/badge/UserBadge'
import { formatReadingTime, getUserLevel } from '@/lib/badge-system'
import RatingsTabComponent from './RatingsTab'
import FollowListModal from './FollowListModal'
import PublicLibraryView from './PublicLibraryView'
import PublicReadingHistory from './PublicReadingHistory'
import PublicNovelsView from './PublicNovelsView'

type Tab = 'novels' | 'library' | 'history' | 'reviews'

type UserData = {
  id: string
  name: string | null
  avatar: string | null
  bio: string | null
  role: string
  contributionPoints: number
  level: number
  isOfficial?: boolean  // Official account flag
  createdAt: Date
  libraryPrivacy?: boolean  // Privacy setting for library
  stats: {
    booksRead: number
    following: number
    followers: number
    totalRatings: number
    readingTime: number
  }
}

// Format numbers: 100+ shows as 1.1k, 20k, 1m, etc.
function formatNumber(num: number): string {
  if (num < 1000) return num.toString()
  if (num < 1000000) {
    const k = num / 1000
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`
  }
  const m = num / 1000000
  return m % 1 === 0 ? `${m}m` : `${m.toFixed(1)}m`
}

interface PublicUserProfileProps {
  user: UserData
  onNovelClick?: (slug: string) => void // Optional: callback when clicking on a novel in reviews
}

export default function PublicUserProfile({ user, onNovelClick }: PublicUserProfileProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('novels')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(user.stats.followers)
  const [followingCount, setFollowingCount] = useState(user.stats.following)
  const [loading, setLoading] = useState(false)
  const [showFollowModal, setShowFollowModal] = useState<'following' | 'followers' | null>(null)
  const levelData = getUserLevel(user.contributionPoints)

  const isOwnProfile = session?.user?.id === user.id
  const isOfficial = user.isOfficial || false // Check if this is an official account

  // Check if library is private and user is not the owner
  const isLibraryPrivate = user.libraryPrivacy && !isOwnProfile

  // Check if current user is following this user
  useEffect(() => {
    if (session?.user?.id && session.user.id !== user.id) {
      fetch(`/api/user/follow-status?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.isFollowing !== undefined) {
            setIsFollowing(data.isFollowing)
          }
        })
        .catch(err => console.error('Failed to fetch follow status:', err))
    }
  }, [session?.user?.id, user.id])

  const handleFollowToggle = async () => {
    if (!session?.user?.id) {
      // Redirect to login or show message
      alert('Please log in to follow users')
      return
    }

    try {
      setLoading(true)
      const method = isFollowing ? 'DELETE' : 'POST'
      const res = await fetch('/api/user/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      if (res.ok) {
        setIsFollowing(!isFollowing)
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update follow status')
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
      alert('Failed to update follow status')
    } finally {
      setLoading(false)
    }
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top user info section */}
      <div className="flex-shrink-0 bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-8 mb-6 mx-6 mt-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Avatar + Badge */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <UserBadge
              avatar={user.avatar}
              name={user.name}
              level={user.level}
              contributionPoints={user.contributionPoints}
              size="large"
              showLevelName={false}
              isOfficial={isOfficial}
            />
            {/* Level name or Followers count below avatar */}
            <div className="text-center">
              {isOfficial ? (
                <button
                  onClick={() => setShowFollowModal('followers')}
                  className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(followersCount)}</div>
                  <div className="text-xs text-gray-600 mt-0.5">Followers</div>
                </button>
              ) : (
                <p className="text-xs font-semibold text-amber-600">{levelData.nameEn}</p>
              )}
            </div>
          </div>

          {/* User info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {user.name || 'Anonymous Reader'}
              </h1>

              {/* Official Account badge for official users */}
              {isOfficial && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs font-bold text-white">Official Account</p>
                </div>
              )}

              {/* Follow button - show if not own profile and user is logged in */}
              {!isOwnProfile && session?.user?.id && (
                <button
                  onClick={handleFollowToggle}
                  disabled={loading}
                  className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all shadow-md disabled:opacity-50 ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                  }`}
                >
                  {loading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>

            {/* Bio - show for non-official accounts in original position */}
            {!isOfficial && user.bio && (
              <p className="text-gray-700 text-sm leading-relaxed mb-4">{user.bio}</p>
            )}

            <p className="text-gray-500 text-sm mb-4">Joined {joinDate}</p>

            {/* Stats cards */}
            {isOfficial ? (
              // Official account: show bio in a simple card
              user.bio && (
                <div className="mt-4">
                  <div className="bg-white/40 backdrop-blur-sm border border-white/60 rounded-lg p-4 shadow-md">
                    <p className="text-gray-700 text-sm leading-relaxed">{user.bio}</p>
                  </div>
                </div>
              )
            ) : (
              // Regular user stats
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {/* Books Read */}
                  <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-4 text-center shadow-lg">
                    <div className="text-2xl font-bold text-gray-900">{user.stats.booksRead}</div>
                    <div className="text-xs text-gray-600 mt-1">Books Read</div>
                  </div>

                  {/* Following - clickable */}
                  <button
                    onClick={() => setShowFollowModal('following')}
                    className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-4 text-center shadow-lg hover:bg-white/60 transition-colors cursor-pointer"
                  >
                    <div className="text-2xl font-bold text-gray-900">{followingCount}</div>
                    <div className="text-xs text-gray-600 mt-1">Following</div>
                  </button>

                  {/* Followers - clickable */}
                  <button
                    onClick={() => setShowFollowModal('followers')}
                    className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-4 text-center shadow-lg hover:bg-white/60 transition-colors cursor-pointer"
                  >
                    <div className="text-2xl font-bold text-gray-900">{followersCount}</div>
                    <div className="text-xs text-gray-600 mt-1">Followers</div>
                  </button>

                  {/* Reviews */}
                  <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-4 text-center shadow-lg">
                    <div className="text-2xl font-bold text-gray-900">{user.stats.totalRatings}</div>
                    <div className="text-xs text-gray-600 mt-1">Reviews</div>
                  </div>
                </div>

                {/* Reading Time - separate row */}
                <div className="mt-4">
                  <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-4 text-center shadow-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {formatReadingTime(user.stats.readingTime)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Reading Time</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 px-6">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('novels')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                activeTab === 'novels'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                  : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
              }`}
            >
              Novels
            </button>
            {/* Only show other tabs for regular users (not official accounts) */}
            {!isOfficial && (
              <>
                {/* Only show Library tab if not private or if viewing own profile */}
                {!isLibraryPrivate && (
                  <button
                    onClick={() => setActiveTab('library')}
                    className={`px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                      activeTab === 'library'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                        : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                    }`}
                  >
                    Library
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                    activeTab === 'history'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                      : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                  }`}
                >
                  Reading History
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                    activeTab === 'reviews'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                      : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                  }`}
                >
                  Reviews
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden px-6 pt-4 pb-6">
        <div className="h-full bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          {activeTab === 'novels' && (
            <PublicNovelsView userId={user.id} />
          )}
          {activeTab === 'library' && (
            <PublicLibraryView userId={user.id} />
          )}
          {activeTab === 'history' && (
            <PublicReadingHistory userId={user.id} />
          )}
          {activeTab === 'reviews' && (
            <div className="h-full overflow-y-auto p-6">
              <RatingsTabComponent userId={user.id} onNovelClick={onNovelClick} />
            </div>
          )}
        </div>
      </div>

      {/* Follow List Modal */}
      {showFollowModal && (
        <FollowListModal
          isOpen={!!showFollowModal}
          onClose={() => setShowFollowModal(null)}
          userId={user.id}
          type={showFollowModal}
          onUserClick={(userId) => router.push(`/profile/${userId}`)}
        />
      )}
    </div>
  )
}
