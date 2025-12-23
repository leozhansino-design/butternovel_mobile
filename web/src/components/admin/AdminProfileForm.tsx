// src/components/admin/AdminProfileForm.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Upload, Save, X } from 'lucide-react'
import AvatarCropper from './AvatarCropper'
import React from 'react'
import { safeParseJson } from '@/lib/fetch-utils'

type Props = {
  adminEmail: string
}

export default function AdminProfileForm({ adminEmail }: Props) {
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [showCropper, setShowCropper] = useState(false)
  const [tempImage, setTempImage] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // ⭐ 初始化加载数据 - 将逻辑移到 useEffect 内部，避免依赖问题
  React.useEffect(() => {
    const loadProfileData = async () => {
      try {
        const response = await fetch('/api/admin/profile', {
          credentials: 'include' // ✅ 确保 cookie 总是被发送
        })
        if (response.ok) {
          const data = await safeParseJson(response)
          setDisplayName(data.displayName || '')
          setBio(data.bio || '')
          setAvatarPreview(data.avatar || '')
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
      }
    }

    loadProfileData()
  }, [])

  // ⭐ 处理头像上传
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Please upload a JPG, PNG, or WebP image' })
      return
    }

    // 验证文件大小
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' })
      return
    }

    // 读取图片
    const reader = new FileReader()
    reader.onload = (event) => {
      const imageData = event.target?.result as string
      setTempImage(imageData)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)

    // 清空输入
    e.target.value = ''
  }

  // ⭐ 裁剪完成
  const handleCropComplete = (croppedImage: string) => {
    setAvatarPreview(croppedImage)
    setShowCropper(false)
    setTempImage('')
    setHasChanges(true)
    setMessage({ type: 'success', text: '✅ Avatar updated' })
  }

  // ⭐ 保存修改
  const handleSave = async () => {
    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'Display name is required' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ 确保 cookie 总是被发送
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim(),
          avatar: avatarPreview,
        }),
      })

      const data = await safeParseJson(response)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile')
      }

      setMessage({ type: 'success', text: '✅ Profile saved successfully!' })
      setHasChanges(false)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  // ⭐ 清除头像
  const handleRemoveAvatar = () => {
    setAvatarPreview('')
    setHasChanges(true)
  }

  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <p
            className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {/* 邮箱信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-sm text-blue-600">Admin Email</p>
        <p className="text-lg font-semibold text-gray-900">{adminEmail}</p>
      </div>

      {/* 显示名设置 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Display Name</h3>
        <p className="text-sm text-gray-600 mb-3">
          This is how you'll appear as an author on the platform (e.g., butterSelections)
        </p>
        <input
          type="text"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value)
            setHasChanges(true)
          }}
          placeholder="Enter your display name..."
          maxLength={50}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-2">{displayName.length} / 50 characters</p>
      </div>

      {/* 简介设置 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Bio</h3>
        <p className="text-sm text-gray-600 mb-3">
          Optional: Add a brief bio that shows on your author profile
        </p>
        <textarea
          value={bio}
          onChange={(e) => {
            setBio(e.target.value)
            setHasChanges(true)
          }}
          placeholder="Tell readers about yourself..."
          maxLength={200}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-2">{bio.length} / 200 characters</p>
      </div>

      {/* 头像设置 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Avatar</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload a circular avatar that will appear next to your name (300x400px recommended)
        </p>

        <div className="space-y-4">
          {/* 头像预览 */}
          {avatarPreview ? (
            <div className="relative w-32 h-32 mx-auto">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={handleRemoveAvatar}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 mx-auto rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Upload size={24} className="text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">No avatar</p>
              </div>
            </div>
          )}

          {/* 上传按钮 */}
          <label className="block">
            <div className="w-full px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-center">
              <p className="text-sm font-medium text-blue-700">Click to upload avatar</p>
              <p className="text-xs text-blue-600 mt-1">JPG, PNG, or WebP • Max 5MB</p>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* 裁剪器模态框 */}
      {showCropper && (
        <AvatarCropper
          imageSrc={tempImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false)
            setTempImage('')
          }}
        />
      )}
    </div>
  )
}