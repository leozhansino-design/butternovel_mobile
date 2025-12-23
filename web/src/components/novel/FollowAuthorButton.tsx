'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface FollowAuthorButtonProps {
  authorId: string
  authorName: string
}

export default function FollowAuthorButton({ authorId, authorName }: FollowAuthorButtonProps) {
  const { data: session, status } = useSession()
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // Don't show if authorId is missing
  if (!authorId) {
    return null
  }

  const isOwnProfile = session?.user?.id === authorId

  // FIX: Use useCallback to prevent infinite loop
  const checkFollowStatus = useCallback(async () => {
    console.log(`[FollowAuthorButton] Checking follow status for author: ${authorId}`)
    try {
      const res = await fetch(`/api/user/follow-status?userId=${authorId}`)
      const data = await res.json()
      console.log(`[FollowAuthorButton] Follow status response:`, data)
      if (data.isFollowing !== undefined) {
        setIsFollowing(data.isFollowing)
        console.log(`[FollowAuthorButton] Updated isFollowing to: ${data.isFollowing}`)
      }
    } catch (error) {
      console.error('[FollowAuthorButton] Failed to check follow status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }, [authorId])

  // Check follow status
  useEffect(() => {
    console.log(`[FollowAuthorButton] useEffect triggered - status: ${status}, isOwnProfile: ${isOwnProfile}, userId: ${session?.user?.id}`)

    if (status === 'authenticated' && session?.user?.id && !isOwnProfile) {
      console.log(`[FollowAuthorButton] Conditions met, calling checkFollowStatus`)
      checkFollowStatus()
    } else {
      console.log(`[FollowAuthorButton] Conditions not met, skipping checkFollowStatus`)
      setCheckingStatus(false)
    }
  }, [status, session?.user?.id, isOwnProfile, checkFollowStatus])

  const handleFollowToggle = async () => {
    if (!session?.user?.id) {
      alert('Please log in to follow authors')
      return
    }

    try {
      setLoading(true)
      const method = isFollowing ? 'DELETE' : 'POST'
      const res = await fetch('/api/user/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authorId })
      })

      if (res.ok) {
        setIsFollowing(!isFollowing)
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

  // Don't show button if viewing own profile (wait for session to load first)
  if (status === 'loading') {
    console.log(`[FollowAuthorButton] Hiding button - status is loading`)
    return null // Wait for session to load
  }

  if (isOwnProfile) {
    console.log(`[FollowAuthorButton] Hiding button - viewing own profile`)
    return null
  }

  if (checkingStatus && session?.user?.id) {
    console.log(`[FollowAuthorButton] Showing button - checking status (loading state)`)
    // Show a loading button while checking status
    return (
      <button
        disabled
        className="ml-3 px-5 py-2 rounded-lg font-medium text-sm bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed"
      >
        Loading...
      </button>
    )
  }

  console.log(`[FollowAuthorButton] Showing button - isFollowing: ${isFollowing}, loading: ${loading}`)

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      className={`ml-3 px-5 py-2 rounded-lg font-medium text-sm transition-all duration-300 cursor-pointer ${
        isFollowing
          ? 'bg-white border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:scale-[1.02] active:scale-[0.98]'
          : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] active:scale-[0.98]'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
