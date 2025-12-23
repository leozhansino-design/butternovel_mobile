'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { countWords, WORD_LIMITS } from '@/lib/validators'
import FormattingToolbar from '@/components/editor/FormattingToolbar'

interface ChapterFormProps {
  mode: 'create' | 'edit'
  novelId: number
  novelTitle: string
  chapterNumber: number
  initialData?: {
    id: number
    title: string
    content: string
    isPublished: boolean
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ChapterForm({
  mode,
  novelId,
  novelTitle,
  chapterNumber,
  initialData,
  onSuccess,
  onCancel
}: ChapterFormProps) {
  const router = useRouter()

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ✅ 计算字符数
  const wordCount = countWords(content)
  const isOverLimit = wordCount > WORD_LIMITS.CHAPTER_CHARS_MAX
  const wordPercentage = Math.min(100, (wordCount / WORD_LIMITS.CHAPTER_CHARS_MAX) * 100)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // 验证
    if (!title.trim()) {
      setMessage({ type: 'error', text: '请输入章节标题' })
      return
    }

    if (title.length > WORD_LIMITS.CHAPTER_TITLE_MAX) {
      setMessage({ type: 'error', text: `标题最多 ${WORD_LIMITS.CHAPTER_TITLE_MAX} 字` })
      return
    }

    if (!content.trim()) {
      setMessage({ type: 'error', text: '请输入章节内容' })
      return
    }

    if (isOverLimit) {
      setMessage({ type: 'error', text: `章节内容超出字符数限制 (${wordCount}/${WORD_LIMITS.CHAPTER_CHARS_MAX})` })
      return
    }

    setLoading(true)

    try {
      const endpoint = mode === 'create'
        ? '/api/admin/chapters'
        : `/api/admin/chapters/${initialData?.id}`

      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          chapterNumber,
          title: title.trim(),
          content: content.trim(),
          wordCount: wordCount,  // ⭐ 发送字符数
          isPublished,
        }),
      })

      if (res.ok) {
        setMessage({
          type: 'success',
          text: mode === 'create' ? '✅ 章节创建成功!' : '✅ 章节更新成功!'
        })

        // 延迟后执行回调或跳转
        setTimeout(() => {
          if (onSuccess) {
            onSuccess()
          } else {
            router.push(`/admin/novels/${novelId}/edit`)
            router.refresh()
          }
        }, 1000)
      } else {
        const data = await res.json()
        setMessage({
          type: 'error',
          text: data.error || (mode === 'create' ? '创建失败' : '更新失败')
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage({
        type: 'error',
        text: '网络错误,请重试'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {mode === 'create' ? '创建章节' : '编辑章节'}
      </h1>

      {/* 章节信息卡片 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">章节信息</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">小说:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{novelTitle}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">章节号:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">第 {chapterNumber} 章</span>
          </div>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            Chapter Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Chapter 1: The Beginning"
            maxLength={WORD_LIMITS.CHAPTER_TITLE_MAX}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            required
            disabled={loading}
          />
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {title.length} / {WORD_LIMITS.CHAPTER_TITLE_MAX} characters
          </div>
        </div>

        {/* Content Input */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            Chapter Content <span className="text-red-500">*</span>
          </label>

          {/* Formatting Toolbar */}
          <FormattingToolbar
            textareaRef={textareaRef}
            value={content}
            onChange={setContent}
          />

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter chapter content... Use **text** for bold, *text* for italic"
            rows={20}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-t-none rounded-b-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            required
            disabled={loading}
            onKeyDown={(e) => {
              // Ctrl+B for bold
              if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault()
                const start = e.currentTarget.selectionStart
                const end = e.currentTarget.selectionEnd
                const selected = content.substring(start, end) || 'text'
                const newContent = content.substring(0, start) + '**' + selected + '**' + content.substring(end)
                setContent(newContent)
                setTimeout(() => {
                  if (textareaRef.current) {
                    textareaRef.current.focus()
                    textareaRef.current.setSelectionRange(start + 2, start + 2 + selected.length)
                  }
                }, 0)
              }
              // Ctrl+I for italic
              if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault()
                const start = e.currentTarget.selectionStart
                const end = e.currentTarget.selectionEnd
                const selected = content.substring(start, end) || 'text'
                const newContent = content.substring(0, start) + '*' + selected + '*' + content.substring(end)
                setContent(newContent)
                setTimeout(() => {
                  if (textareaRef.current) {
                    textareaRef.current.focus()
                    textareaRef.current.setSelectionRange(start + 1, start + 1 + selected.length)
                  }
                }, 0)
              }
            }}
          />

          {/* Character count and progress bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <div className={`text-sm font-medium ${isOverLimit ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                Characters: {wordCount.toLocaleString()} / {WORD_LIMITS.CHAPTER_CHARS_MAX.toLocaleString()}
                {isOverLimit && ' ⚠️ Limit exceeded'}
              </div>
            </div>

            {wordCount > 0 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isOverLimit ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${wordPercentage}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 发布状态 */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublished"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded"
            disabled={loading}
          />
          <label htmlFor="isPublished" className="text-sm text-gray-900 dark:text-gray-100">
            立即发布 (取消勾选则保存为草稿)
          </label>
        </div>

        {/* 按钮组 */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || isOverLimit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? '处理中...'
              : mode === 'create'
              ? '创建章节'
              : '保存修改'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              取消
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              router.push(`/admin/novels/${novelId}/edit`)
            }}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            返回小说
          </button>
        </div>
      </form>
    </div>
  )
}
