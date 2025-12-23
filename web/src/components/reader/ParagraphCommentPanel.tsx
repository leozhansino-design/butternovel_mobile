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
  paragraphIndex: number | null
  onClose: () => void
  bgColor?: string
  textColor?: string
  highlightCommentId?: string
}

// Common emojis for quick selection
const commonEmojis = ['😀', '😂', '🥰', '😍', '🤔', '👍', '👏', '❤️', '🔥', '✨', '💯', '🎉', '😊', '😎', '🤗', '😢', '😭', '😱', '🙏', '💪', '🌟', '💖', '😌', '🥺']

export default function ParagraphCommentPanel({
  novelId,
  chapterId,
  paragraphIndex,
  onClose,
  bgColor = 'bg-white',
  textColor = 'text-gray-900',
  highlightCommentId
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

  // Dynamic styles based on background color
  const isDark = bgColor.includes('dark') || bgColor.includes('#1a1a1a')
  const inputBg = isDark ? 'bg-gray-800' : 'bg-black/5'
  const inputBorder = isDark ? 'border-gray-600' : 'border-black/10'
  const inputText = isDark ? 'text-white' : 'text-gray-900'
  const hoverBg = isDark ? 'hover:bg-gray-700' : 'hover:bg-black/5'
  const cardBg = isDark ? 'bg-gray-800' : 'bg-black/5'
  const borderColor = isDark ? 'border-gray-700' : 'border-black/10'
  const mutedText = isDark ? 'text-gray-400' : 'text-gray-500'
  const dropdownBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'

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

  useEffect(() => {
    // ⚠️ 防止无限循环：只在 paragraphIndex 不为 null 时获取评论
    // 如果 paragraphIndex 是 null，说明评论面板未打开，不需要请求
    if (paragraphIndex === null) {
      setLoading(false)
      return
    }

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

        if (!cancelled && data.success) {
          setComments(data.data || [])
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('[ParagraphCommentPanel] Failed to fetch comments:', error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchComments()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [chapterId, paragraphIndex])

  // Scroll to highlighted comment after comments are loaded
  useEffect(() => {
    if (highlightCommentId && comments.length > 0 && !loading) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        const element = document.getElementById(`comment-${highlightCommentId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [highlightCommentId, comments, loading])

  const fetchReplies = async (commentId: string) => {
    if (replies[commentId]) {
      // Toggle if already loaded
      setShowReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }))
      return
    }

    setLoadingReplies(prev => ({ ...prev, [commentId]: true }))
    try {
      const res = await fetch(`/api/paragraph-comments/${commentId}/replies`)
      const data = await res.json()
      if (data.success) {
        setReplies(prev => ({ ...prev, [commentId]: data.data || [] }))
        setShowReplies(prev => ({ ...prev, [commentId]: true }))
      }
    } catch (error) {
      console.error('Failed to fetch replies:', error)
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }))
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
      alert('Only JPG and PNG images are allowed')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setImage(base64)
      setImagePreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleReplyImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
      alert('Only JPG and PNG images are allowed')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setReplyImage(base64)
      setReplyImagePreview(base64)
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
          image,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setComments(prev => [data.data, ...prev])
        setContent('')
        setImage(null)
        setImagePreview(null)
      } else {
        alert(data.error || 'Failed to post comment')
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
      alert('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!session?.user?.id) {
      setShowLoginModal(true)
      return
    }

    if (!replyContent.trim()) {
      alert('Reply content cannot be empty')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch(`/api/paragraph-comments/${parentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          chapterId,
          paragraphIndex,
          content: replyContent.trim(),
          image: replyImage,
        }),
      })

      const data = await res.json()

      if (data.success) {
        // Add reply to replies list
        setReplies(prev => ({
          ...prev,
          [parentId]: [...(prev[parentId] || []), data.data]
        }))
        setShowReplies(prev => ({ ...prev, [parentId]: true }))

        // Update comment's reply count
        setComments(prev => prev.map(c =>
          c.id === parentId
            ? { ...c, _count: { replies: (c._count?.replies || 0) + 1 } }
            : c
        ))

        // Reset reply form
        setReplyingTo(null)
        setReplyContent('')
        setReplyImage(null)
        setReplyImagePreview(null)
      } else {
        alert(data.error || 'Failed to post reply')
      }
    } catch (error) {
      console.error('Failed to submit reply:', error)
      alert('Failed to post reply')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const res = await fetch(`/api/paragraph-comments/${commentId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
      } else {
        alert('Failed to delete comment')
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('Failed to delete comment')
    }
  }

  const handleLike = async (commentId: string) => {
    try {
      const res = await fetch(`/api/paragraph-comments/${commentId}/like`, {
        method: 'POST',
      })

      const data = await res.json()

      if (data.success) {
        setComments(prev =>
          prev.map(c =>
            c.id === commentId ? { ...c, likeCount: data.data.likeCount } : c
          )
        )
      }
    } catch (error) {
      console.error('Failed to like comment:', error)
    }
  }

  const addEmoji = (emoji: string) => {
    if (replyingTo) {
      setReplyContent(prev => prev + emoji)
      setShowReplyEmojiPicker(false)
    } else {
      setContent(prev => prev + emoji)
      setShowEmojiPicker(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${bgColor}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${bgColor} ${textColor}`}>
      {/* Header */}
      <div className={`flex-shrink-0 flex items-center justify-between px-4 py-3 border-b ${borderColor}`}>
        <h3 className="text-lg font-bold">
          💬 Comments ({comments.length})
        </h3>
        <button
          onClick={onClose}
          className={`p-2 ${hoverBg} rounded-full transition-colors`}
          aria-label="Close comments"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className={`text-center py-12 ${mutedText}`}>
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              id={`comment-${comment.id}`}
              className={`${cardBg} rounded-lg p-4 transition-colors ${
                highlightCommentId === comment.id ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
              }`}
            >
              {/* Comment header */}
              <div className="flex items-start gap-3">
                <div
                  onClick={() => setSelectedUserId(comment.user.id)}
                  className="cursor-pointer"
                >
                  <UserBadge
                    avatar={comment.user.avatar}
                    name={comment.user.name}
                    level={comment.user.level}
                    contributionPoints={comment.user.contributionPoints}
                    size="small"
                    isOfficial={comment.user.isOfficial}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {comment.user.name || 'Anonymous'}
                    </span>
                    {comment.user.isOfficial && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Official
                      </span>
                    )}
                    <span className={`text-xs ${mutedText}`}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="mt-1 whitespace-pre-wrap">{comment.content}</p>

                  {comment.imageUrl && (
                    <div className="mt-2">
                      <Image
                        src={comment.imageUrl}
                        alt="Comment image"
                        width={300}
                        height={200}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className={`flex items-center gap-1 text-sm ${mutedText} hover:text-blue-600 transition-colors`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span>{comment.likeCount}</span>
                    </button>

                    <button
                      onClick={() => setReplyingTo(comment.id)}
                      className={`flex items-center gap-1 text-sm ${mutedText} hover:text-blue-600 transition-colors`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Reply
                    </button>

                    {(comment._count?.replies || 0) > 0 && (
                      <button
                        onClick={() => fetchReplies(comment.id)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        {loadingReplies[comment.id] ? (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                        <span>{comment._count?.replies} {comment._count?.replies === 1 ? 'reply' : 'replies'}</span>
                      </button>
                    )}

                    {session?.user?.id === comment.user.id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-sm text-red-600 hover:text-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 pl-4 border-l-2 border-blue-500">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className={`w-full p-2 border ${inputBorder} ${inputBg} ${inputText} rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400`}
                        rows={2}
                      />

                      {replyImagePreview && (
                        <div className="relative mt-2 inline-block">
                          <Image
                            src={replyImagePreview}
                            alt="Preview"
                            width={80}
                            height={80}
                            className="rounded-lg object-cover"
                          />
                          <button
                            onClick={() => {
                              setReplyImage(null)
                              setReplyImagePreview(null)
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => replyFileInputRef.current?.click()}
                            className={`p-2 ${hoverBg} rounded-lg transition-colors`}
                            title="Upload image"
                          >
                            <svg className={`w-5 h-5 ${mutedText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <input
                            ref={replyFileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleReplyImageSelect}
                            className="hidden"
                          />

                          <div className="relative">
                            <button
                              onClick={() => setShowReplyEmojiPicker(!showReplyEmojiPicker)}
                              className={`p-2 ${hoverBg} rounded-lg transition-colors`}
                              title="Add emoji"
                            >
                              <svg className={`w-5 h-5 ${mutedText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>

                            {showReplyEmojiPicker && (
                              <div className={`absolute bottom-full left-0 mb-2 ${dropdownBg} border rounded-lg shadow-lg p-3 z-10`} style={{ width: '280px' }}>
                                <div className="grid grid-cols-8 gap-1">
                                  {commonEmojis.map((emoji, index) => (
                                    <button
                                      key={index}
                                      onClick={() => addEmoji(emoji)}
                                      className={`text-2xl ${hoverBg} rounded p-1 transition-colors`}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyContent('')
                              setReplyImage(null)
                              setReplyImagePreview(null)
                            }}
                            className={`px-3 py-1.5 text-sm ${mutedText} ${hoverBg} rounded-lg transition-colors`}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={submitting || !replyContent.trim()}
                            className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {submitting ? 'Posting...' : 'Reply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies list */}
                  {showReplies[comment.id] && replies[comment.id] && (
                    <div className={`mt-3 pl-4 border-l-2 ${borderColor} space-y-3`}>
                      {replies[comment.id].map(reply => (
                        <div key={reply.id} className={`${cardBg} rounded-lg p-3`}>
                          <div className="flex items-start gap-2">
                            <div
                              onClick={() => setSelectedUserId(reply.user.id)}
                              className="cursor-pointer"
                            >
                              <UserBadge
                                avatar={reply.user.avatar}
                                name={reply.user.name}
                                level={reply.user.level}
                                contributionPoints={reply.user.contributionPoints}
                                size="small"
                                isOfficial={reply.user.isOfficial}
                              />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold text-sm ${textColor}`}>
                                  {reply.user.name || 'Anonymous'}
                                </span>
                                {reply.user.isOfficial && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Official
                                  </span>
                                )}
                                <span className={`text-xs ${mutedText}`}>
                                  {new Date(reply.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              <p className={`mt-1 text-sm ${textColor} whitespace-pre-wrap`}>{reply.content}</p>

                              {reply.imageUrl && (
                                <div className="mt-2">
                                  <Image
                                    src={reply.imageUrl}
                                    alt="Reply image"
                                    width={200}
                                    height={150}
                                    className="rounded-lg object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Input - 固定在底部 */}
      <div className={`flex-shrink-0 border-t ${borderColor} ${bgColor}`}>
        <div className="p-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="💭 Share your thoughts..."
            className={`w-full p-3 border ${inputBorder} ${inputBg} ${inputText} rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-400 transition-all`}
            rows={2}
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="relative mt-2 inline-block">
              <Image
                src={imagePreview}
                alt="Preview"
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
              <button
                onClick={() => {
                  setImage(null)
                  setImagePreview(null)
                }}
                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors shadow-md"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              {/* Image upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 ${hoverBg} rounded-lg transition-all hover:scale-110`}
                title="Upload image"
              >
                <svg className={`w-5 h-5 ${mutedText} hover:text-blue-500 transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Emoji picker button */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 ${hoverBg} rounded-lg transition-all hover:scale-110`}
                  title="Add emoji"
                >
                  <svg className={`w-5 h-5 ${mutedText} hover:text-blue-500 transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Emoji picker dropdown */}
                {showEmojiPicker && (
                  <div className={`absolute bottom-full left-0 mb-2 ${dropdownBg} border rounded-xl shadow-xl p-3 z-10`} style={{ width: '280px' }}>
                    <div className="grid grid-cols-8 gap-1">
                      {commonEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => addEmoji(emoji)}
                          className={`text-2xl ${hoverBg} rounded-lg p-1 transition-all hover:scale-125`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Posting...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Post
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Library Modal */}
      {selectedUserId && (
        <LibraryModal
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
          user={{}}
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
    </div>
  )
}
