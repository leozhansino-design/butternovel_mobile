'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import UserBadge from '@/components/badge/UserBadge'
import LibraryModal from '@/components/shared/LibraryModal'
import LoginModal from '@/components/shared/LoginModal'

interface Comment {
  id: string
  content: string
  imageUrl?: string
  likeCount: number
  replyCount?: number
  createdAt: string
  user: {
    id: string
    name: string | null
    avatar: string | null
    level: number
    contributionPoints: number
    role: string
    isOfficial?: boolean
  }
  _count?: {
    replies: number
  }
}

interface ParagraphCommentPanelProps {
  novelId: number
  chapterId: number
  paragraphIndex: number
  onClose: () => void
}

export default function ParagraphCommentPanel({
  novelId,
  chapterId,
  paragraphIndex,
  onClose
}: ParagraphCommentPanelProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [content, setContent] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Reply states
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyImage, setReplyImage] = useState<string | null>(null)
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null)
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({})
  const [replies, setReplies] = useState<Record<string, Comment[]>>({})
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({})
  const replyFileInputRef = useRef<HTMLInputElement>(null)

  // Emoji picker states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false)

  // Common emojis for quick selection
  const commonEmojis = ['😀', '😂', '🥰', '😍', '🤔', '👍', '👏', '❤️', '🔥', '✨', '💯', '🎉', '😊', '😎', '🤗', '😢', '😭', '😱', '🙏', '💪']

  // 🔧 FIXED: 添加AbortController和cleanup避免竞态条件
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const fetchComments = async () => {
      try {
        setLoading(true)
        const res = await fetch(
          `/api/paragraph-comments?chapterId=${chapterId}&paragraphIndex=${paragraphIndex}`,
          { signal: controller.signal }
        )
        const data = await res.json()

        // 只在组件未卸载时更新状态
        if (!cancelled && data.success) {
          setComments(data.data || [])
        }
      } catch (error) {
        // 忽略取消错误
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch comments:', error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchComments()

    // Cleanup：取消请求并标记组件已卸载
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [chapterId, paragraphIndex])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/paragraph-comments?chapterId=${chapterId}&paragraphIndex=${paragraphIndex}`
      )
      const data = await res.json()
      if (data.success) {
        setComments(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
      alert('Only JPG and PNG images are allowed')
      return
    }

    // 验证文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB')
      return
    }

    // 读取文件并转换为base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setImage(base64)
      setImagePreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!session?.user?.id) {
      setShowLoginModal(true)
      return
    }

    if (!content.trim()) {
      alert('Comment content cannot be empty')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/paragraph-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          chapterId,
          paragraphIndex,
          content: content.trim(),
          image
        })
      })

      const data = await res.json()
      if (data.success) {
        // 添加新评论到列表
        setComments([data.data, ...comments])
        // 清空输入
        setContent('')
        setImage(null)
        setImagePreview(null)
      } else {
        alert(data.error || 'Failed to post comment')
      }
    } catch (error) {
      console.error('Failed to post comment:', error)
      alert('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (commentId: string) => {
    try {
      const res = await fetch(`/api/paragraph-comments/${commentId}/like`, {
        method: 'POST'
      })

      const data = await res.json()
      if (data.success) {
        // 更新评论的点赞数
        setComments(comments.map(c =>
          c.id === commentId ? { ...c, likeCount: c.likeCount + 1 } : c
        ))
      } else {
        if (data.error === 'Already liked') {
          alert('You have already liked this comment')
        }
      }
    } catch (error) {
      console.error('Failed to like comment:', error)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      const res = await fetch(`/api/paragraph-comments/${commentId}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        setComments(comments.filter(c => c.id !== commentId))
      } else {
        alert(data.error || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('Failed to delete comment')
    }
  }

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId)
  }

  return (
    <>
      <div className="h-full flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <h3 className="font-bold text-gray-900">
              Comments ({comments.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/80 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <p className="text-gray-400 text-sm">No comments yet</p>
              <p className="text-gray-300 text-xs mt-1">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                {/* User info */}
                <div className="flex items-start gap-3 mb-3">
                  <button
                    onClick={() => handleUserClick(comment.user.id)}
                    className="flex-shrink-0 cursor-pointer"
                  >
                    <UserBadge
                      avatar={comment.user.avatar}
                      name={comment.user.name}
                      level={comment.user.level}
                      contributionPoints={comment.user.contributionPoints}
                      size="small"
                      showLevelName={false}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleUserClick(comment.user.id)}
                      className="font-semibold text-gray-900 hover:text-amber-600 transition-colors text-sm cursor-pointer"
                    >
                      {comment.user.name || 'Anonymous'}
                    </button>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {/* Delete button for own comments */}
                  {session?.user?.id === comment.user.id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Comment content */}
                <p className="text-gray-700 text-sm leading-relaxed mb-2">{comment.content}</p>

                {/* Comment image */}
                {comment.imageUrl && (
                  <div className="relative w-full max-w-sm h-48 rounded-lg overflow-hidden mb-3">
                    <Image
                      src={comment.imageUrl}
                      alt="Comment image"
                      fill
                      className="object-contain bg-gray-100"
                    />
                  </div>
                )}

                {/* Like button */}
                <button
                  onClick={() => handleLike(comment.id)}
                  className="flex items-center gap-1 text-gray-500 hover:text-amber-600 transition-colors text-xs"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  <span>{comment.likeCount}</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        {session?.user?.id ? (
          <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-gray-50">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              rows={3}
              maxLength={1000}
            />

            {/* Image preview */}
            {imagePreview && (
              <div className="relative mt-2 w-32 h-32 rounded-lg overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => {
                    setImage(null)
                    setImagePreview(null)
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  disabled={!!image}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="text-xs text-gray-400">
                  {content.length}/1000
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !content.trim()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold"
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 border-t border-gray-200 p-6 bg-gray-50 text-center">
            <p className="text-gray-600 mb-4">Please log in to post a comment</p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all text-sm font-semibold"
            >
              Log In
            </button>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedUserId && (
        <LibraryModal
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
          user={{
            name: session?.user?.name,
            email: session?.user?.email,
            image: session?.user?.image
          }}
          viewUserId={selectedUserId}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </>
  )
}
