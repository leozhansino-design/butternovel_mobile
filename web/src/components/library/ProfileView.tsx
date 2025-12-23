// src/components/library/ProfileView.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import UserBadge from '@/components/badge/UserBadge'
import { formatReadingTime, getUserLevel } from '@/lib/badge-system'
import FollowListModal from '@/components/profile/FollowListModal'

type ProfileViewProps = {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  onNavigate?: (tab: 'library' | 'history' | 'upload' | 'manage') => void
}

type ProfileData = {
  id: string
  name: string | null
  email: string | null
  avatar: string | null
  bio: string | null
  contributionPoints: number
  level: number
  libraryPrivacy: boolean  // Privacy setting for library
  stats: {
    booksRead: number
    following: number
    followers: number
    totalRatings: number
    readingTime: number
  }
}

export default function ProfileView({ user, onNavigate }: ProfileViewProps) {
  const router = useRouter()
  // ✅ Get session update function
  const { update } = useSession()

  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showFollowModal, setShowFollowModal] = useState<'following' | 'followers' | null>(null)

  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [error, setError] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle privacy toggle
  const handlePrivacyToggle = async (newValue: boolean) => {
    setUpdatingPrivacy(true)
    try {
      const res = await fetch('/api/profile/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libraryPrivacy: newValue })
      })

      if (res.ok) {
        setProfileData(prev => prev ? { ...prev, libraryPrivacy: newValue } : null)
      } else {
        const data = await res.json()
        console.error('[ProfileView] Failed to update privacy:', data)
        alert(data.error || 'Failed to update privacy settings')
      }
    } catch (error) {
      console.error('[ProfileView] Error updating privacy:', error)
      alert('Failed to update privacy settings')
    } finally {
      setUpdatingPrivacy(false)
    }
  }

  // ✅ Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const profileRes = await fetch('/api/profile')
        const profileData = await profileRes.json()

        if (profileRes.ok) {
          setProfileData(profileData.user)
          setEditName(profileData.user.name || '')
          setEditBio(profileData.user.bio || '')
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = async () => {
    if (editName.trim().length === 0) {
      setError('Name cannot be empty')
      return
    }

    if (editBio.length > 500) {
      setError('Bio must be 500 characters or less')
      return
    }

    try {
      setSaving(true)
      setError('')

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          bio: editBio.trim()
        })
      })

      const data = await res.json()

      if (res.ok) {
        setProfileData(prev => prev ? {
          ...prev,
          name: data.user.name,
          bio: data.user.bio
        } : null)
        setIsEditing(false)

        // ✅ Update next-auth session to sync with Header/UserMenu
        await update({
          name: data.user.name,
        })
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditName(profileData?.name || '')
    setEditBio(profileData?.bio || '')
    setError('')
    setIsEditing(false)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Clear previous error
    setAvatarError('')

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please upload an image file (PNG, JPG, etc.)')
      e.target.value = ''
      return
    }

    // 验证文件大小 (最大 512KB)
    if (file.size > 512 * 1024) {
      setAvatarError('Image must be under 512KB')
      e.target.value = ''
      return
    }

    try {
      setUploadingAvatar(true)

      // 验证图片最小尺寸（至少 256x256，服务端会自动裁剪为正方形）
      const validImage = await validateImageMinSize(file, 256, 256)

      if (!validImage) {
        setAvatarError('Image must be at least 256x256 pixels')
        setUploadingAvatar(false)
        e.target.value = ''
        return
      }

      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok) {
        setProfileData(prev => prev ? {
          ...prev,
          avatar: data.avatar
        } : null)

        // ✅ Update next-auth session to sync avatar with Header/UserMenu
        await update({
          image: data.avatar,
        })

        // Clear error on success
        setAvatarError('')
      } else {
        setAvatarError(data.error || 'Failed to upload avatar')
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      setAvatarError('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      // 清空 input，允许重新选择同一文件
      if (e.target) e.target.value = ''
    }
  }

  // 验证图片最小尺寸（宽高都必须 >= 最小值，服务端会自动裁剪）
  const validateImageMinSize = (file: File, minWidth: number, minHeight: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image()

      img.onload = () => {
        URL.revokeObjectURL(img.src)
        const isValid = img.width >= minWidth && img.height >= minHeight
        resolve(isValid)
      }

      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        console.error('[ProfileView] Failed to load image for validation')
        resolve(false)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">Failed to load profile</p>
      </div>
    )
  }

  const avatarUrl = profileData.avatar || user.image
  const levelData = getUserLevel(profileData.contributionPoints)

  return (
    <div>
      {/* 毛玻璃 Profile 卡片 - 移动端优化 */}
      <div className="relative backdrop-blur-2xl bg-white/70 rounded-xl sm:rounded-2xl shadow-xl border border-white/30 p-3 sm:p-6">
        {/* 渐变背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-xl sm:rounded-2xl pointer-events-none" />

        <div className="relative flex items-start gap-3 sm:gap-6">
          {/* Avatar with Badge and upload */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="relative group">
              <div onClick={handleAvatarClick} className="cursor-pointer" title="Upload avatar: min 256x256px, max 512KB">
                <UserBadge
                  avatar={avatarUrl}
                  name={profileData.name}
                  level={profileData.level}
                  contributionPoints={profileData.contributionPoints}
                  size="large"
                  showLevelName={false}
                />
              </div>

              {/* Upload overlay with requirements */}
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute inset-0 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white text-xs font-semibold disabled:cursor-not-allowed"
              >
                {uploadingAvatar ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <span>Change</span>
                    <span className="text-[10px] font-normal mt-1">min 256x256</span>
                    <span className="text-[10px] font-normal">max 512KB</span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Level name below avatar */}
            <div className="text-center">
              <p className="text-xs font-semibold text-amber-600">{levelData.nameEn}</p>
            </div>

            {/* Avatar error message */}
            {avatarError && (
              <div className="text-center max-w-[120px]">
                <p className="text-xs text-red-600 font-medium">{avatarError}</p>
              </div>
            )}
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white/80"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none bg-white/80"
                    placeholder="Tell us about yourself..."
                  />
                  <span className="text-xs text-gray-400 mt-1">{editBio.length}/500</span>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2 text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 shadow-md"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-5 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-white/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    {profileData.name || 'Anonymous Reader'}
                  </h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-amber-500 hover:bg-white/60 rounded-lg transition-colors flex-shrink-0"
                    title="Edit profile"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-4 truncate">{profileData.email}</p>

                {/* Bio - 移动端隐藏 */}
                {profileData.bio ? (
                  <p className="hidden sm:block text-gray-700 text-sm leading-relaxed mb-4 line-clamp-2">{profileData.bio}</p>
                ) : (
                  <p className="hidden sm:block text-gray-400 italic text-sm mb-4">No bio yet. Click the edit button to add one!</p>
                )}

                {/* Stats cards - 移动端2列，桌面端4列 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {/* Books Read */}
                  <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-2 sm:p-3 text-center shadow-lg">
                    <div className="text-base sm:text-lg font-bold text-gray-900">{profileData.stats.booksRead}</div>
                    <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5">Books</div>
                  </div>

                  {/* Following - clickable */}
                  <button
                    onClick={() => setShowFollowModal('following')}
                    className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-2 sm:p-3 text-center shadow-lg hover:bg-white/60 transition-colors cursor-pointer"
                  >
                    <div className="text-base sm:text-lg font-bold text-gray-900">{profileData.stats.following}</div>
                    <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5">Following</div>
                  </button>

                  {/* Followers - clickable */}
                  <button
                    onClick={() => setShowFollowModal('followers')}
                    className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-2 sm:p-3 text-center shadow-lg hover:bg-white/60 transition-colors cursor-pointer"
                  >
                    <div className="text-base sm:text-lg font-bold text-gray-900">{profileData.stats.followers}</div>
                    <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5">Followers</div>
                  </button>

                  {/* Reviews */}
                  <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-2 sm:p-3 text-center shadow-lg">
                    <div className="text-base sm:text-lg font-bold text-gray-900">{profileData.stats.totalRatings}</div>
                    <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5">Reviews</div>
                  </div>
                </div>

                {/* Reading Time + Privacy - 移动端隐藏，保持界面简洁 */}
                <div className="hidden sm:block mt-3">
                  <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-3 text-center shadow-lg">
                    <div className="text-sm font-bold text-gray-900">{formatReadingTime(profileData.stats.readingTime)}</div>
                    <div className="text-xs text-gray-600 mt-0.5">Reading Time</div>
                  </div>
                </div>

                {/* Privacy Settings - 移动端隐藏 */}
                <div className="hidden sm:block mt-3">
                  <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">Library Privacy</div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {profileData.libraryPrivacy ? 'Only you can see your library' : 'Everyone can see your library'}
                        </div>
                      </div>
                      <button
                        onClick={() => handlePrivacyToggle(!profileData.libraryPrivacy)}
                        disabled={updatingPrivacy}
                        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          profileData.libraryPrivacy ? 'bg-amber-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            profileData.libraryPrivacy ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follow List Modal */}
      {showFollowModal && profileData && (
        <FollowListModal
          isOpen={!!showFollowModal}
          onClose={() => setShowFollowModal(null)}
          userId={profileData.id}
          type={showFollowModal}
          onUserClick={(userId) => {
            setShowFollowModal(null)
            router.push(`/profile/${userId}`)
          }}
        />
      )}
    </div>
  )
}
