'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, MessageSquare, Heart, Star, Clock } from 'lucide-react'

type ActivityType = 'chapter_published' | 'comment' | 'like' | 'rating'

interface Activity {
  type: ActivityType
  timestamp: string
  data: any
}

export default function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await fetch('/api/dashboard/activities')
        if (res.ok) {
          const data = await res.json()
          setActivities(data.activities || [])
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  // Format timestamp to relative time (e.g., "5m ago", "2h ago")
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMinutes < 1) return 'just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return time.toLocaleDateString()
  }

  // Get icon and color based on activity type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'chapter_published':
        return <BookOpen className="w-5 h-5 text-blue-600" />
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-green-600" />
      case 'like':
        return <Heart className="w-5 h-5 text-red-600" />
      case 'rating':
        return <Star className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  // Get activity text
  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'chapter_published':
        return (
          <>
            Published chapter <span className="font-semibold">{activity.data.chapterTitle}</span> in{' '}
            <span className="font-semibold">{activity.data.novelTitle}</span>
          </>
        )
      case 'comment':
        return (
          <>
            New comment on <span className="font-semibold">{activity.data.novelTitle}</span>
          </>
        )
      case 'like':
        return (
          <>
            Someone liked <span className="font-semibold">{activity.data.novelTitle}</span>
          </>
        )
      case 'rating':
        return (
          <>
            New {activity.data.rating}-star rating on{' '}
            <span className="font-semibold">{activity.data.novelTitle}</span>
          </>
        )
      default:
        return 'Unknown activity'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
        </div>
        <div className="px-6 py-12 text-center text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>Loading activities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
      </div>

      {activities.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {activities.map((activity, index) => (
            <Link
              key={`${activity.type}-${activity.timestamp}-${index}`}
              href={`/novels/${activity.data.novelSlug}`}
              className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  {getActivityText(activity)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-6 py-12 text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No recent activities</p>
          <p className="text-xs mt-1">Your recent chapters, likes, and ratings will appear here</p>
        </div>
      )}
    </div>
  )
}
