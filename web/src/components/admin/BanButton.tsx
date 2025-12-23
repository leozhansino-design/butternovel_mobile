// src/components/admin/BanButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { safeParseJson } from '@/lib/fetch-utils'

type Props = {
  novelId: number
  isBanned: boolean
}

export default function BanButton({ novelId, isBanned }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [optimisticBanned, setOptimisticBanned] = useState(isBanned)  // ⭐ 本地状态

  async function handleToggleBan() {
    const newBannedState = !optimisticBanned
    const action = optimisticBanned ? 'unban' : 'ban'
    const confirmMsg = optimisticBanned 
      ? 'Unban this novel? It will be visible to readers again.'
      : 'Ban this novel? It will be hidden from readers.'
    
    if (!confirm(confirmMsg)) return

    // ⭐ 立即更新 UI
    setOptimisticBanned(newBannedState)
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/novels/${novelId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ 确保 cookie 总是被发送
        body: JSON.stringify({ isBanned: newBannedState })
      })

      const data = await safeParseJson(response)

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action}`)
      }

      router.refresh()
      setLoading(false)

    } catch (error: any) {
      // ⭐ 出错回滚状态
      setOptimisticBanned(optimisticBanned)
      alert(error.message)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggleBan}
      disabled={loading}
      className={`px-3 py-1.5 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        optimisticBanned  // ⭐ 使用本地状态
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-red-600 text-white hover:bg-red-700'
      }`}
    >
      {loading ? '...' : optimisticBanned ? 'Unban' : 'Ban'}  {/* ⭐ 使用本地状态 */}
    </button>
  )
}