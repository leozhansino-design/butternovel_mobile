// src/components/dashboard/WriterProfileCard.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { safeParseJson } from '@/lib/fetch-utils'

type WriterProfileCardProps = {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

type ProfileData = {
  id: string
  name: string | null
  email: string | null
  avatar: string | null
  bio: string | null
}

export default function WriterProfileCard({ user }: WriterProfileCardProps) {
  // ✅ Get session update function
  const { update } = useSession()

  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [error, setError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/profile')
        const data = await safeParseJson(response)

        if (response.ok) {
          setProfileData(data.user)
          setEditName(data.user.name || '')
          setEditBio(data.user.bio || '')
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

      const data = await safeParseJson(res)

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

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)')
      return
    }

    if (file.size > 512 * 1024) {
      setError('Image must be smaller than 512KB')
      return
    }

    try {
      setUploadingAvatar(true)
      setError('')

      const validImage = await validateImageSize(file, 256, 256)

      if (!validImage) {
        setError('Image must be exactly 256x256 pixels')
        setUploadingAvatar(false)
        return
      }

      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData
      })

      const data = await safeParseJson(res)

      if (res.ok) {
        setProfileData(prev => prev ? {
          ...prev,
          avatar: data.avatar
        } : null)

        // ✅ Update next-auth session to sync avatar with Header/UserMenu
        await update({
          image: data.avatar,
        })
      } else {
        setError(data.error || 'Failed to upload avatar')
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      setError('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      if (e.target) e.target.value = ''
    }
  }

  const validateImageSize = (file: File, requiredWidth: number, requiredHeight: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image()

      img.onload = () => {
        URL.revokeObjectURL(img.src)
        const isValid = img.width === requiredWidth && img.height === requiredHeight
        resolve(isValid)
      }

      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        resolve(false)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  if (loading) {
    return (
      <div className="relative backdrop-blur-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl shadow-xl border border-white/30 p-6">
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="relative backdrop-blur-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl shadow-xl border border-white/30 p-6">
        <div className="flex items-center justify-center h-24">
          <p className="text-gray-600">Failed to load profile</p>
        </div>
      </div>
    )
  }

  const avatarUrl = profileData.avatar || user.image

  return (
    <div className="relative backdrop-blur-2xl bg-white/70 rounded-2xl shadow-xl border border-white/30 p-6">
      {/* 渐变背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-2xl pointer-events-none" />

      <div className="relative flex items-center gap-6">
        {/* Avatar with upload */}
        <div className="relative group flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={profileData.name || 'User'}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white/50 shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center text-gray-900 font-bold text-3xl ring-4 ring-white/50 shadow-lg border border-gray-300">
              {profileData.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}

          {/* Upload overlay */}
          <button
            onClick={handleAvatarClick}
            disabled={uploadingAvatar || isEditing}
            className="absolute inset-0 bg-black/70 rounded-2xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-xs font-semibold disabled:cursor-not-allowed"
          >
            {uploadingAvatar ? 'Uploading...' : 'Change'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
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
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80"
                  placeholder="Your name"
                />
              </div>
              <div>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white/80"
                  placeholder="Tell readers about yourself..."
                />
                <span className="text-xs text-gray-400 mt-1">{editBio.length}/500</span>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 shadow-md"
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
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-gray-900 truncate">
                  {profileData.name || 'Anonymous Writer'}
                </h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-white/60 rounded-lg transition-colors flex-shrink-0"
                  title="Edit profile"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-3 truncate">{profileData.email}</p>

              {profileData.bio ? (
                <p className="text-gray-700 text-sm leading-relaxed line-clamp-1">{profileData.bio}</p>
              ) : (
                <p className="text-gray-400 italic text-sm">No bio yet. Click the edit button to add one!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
