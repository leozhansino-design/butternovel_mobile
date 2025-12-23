'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Send } from 'lucide-react'
import Link from 'next/link'
import CharacterCountProgress from '@/components/shared/CharacterCountProgress'

const CHAR_LIMIT = 30000
const TITLE_LIMIT = 100
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

type Chapter = {
  id: number
  chapterNumber: number
  title: string
  wordCount: number
  isPublished: boolean
}

export default function NewChapterPage() {
  const params = useParams()
  const router = useRouter()
  const novelId = params.id as string

  const [novel, setNovel] = useState<any>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Calculate character count
  const charCount = content.length
  const isOverLimit = charCount > CHAR_LIMIT

  // Fetch novel and chapters
  useEffect(() => {
    const fetchNovel = async () => {
      try {
        const response = await fetch(`/api/dashboard/novels/${novelId}`)
        if (response.ok) {
          const data = await response.json()
          setNovel(data.novel)
          setChapters(data.novel.chapters || [])
        }
      } catch (error) {
        console.error('Failed to fetch novel:', error)
      }
    }
    fetchNovel()
  }, [novelId])

  // Save draft
  const saveDraft = useCallback(async (clearFormAfterSave = false) => {
    if (!title.trim() || !content.trim()) return

    setSaving(true)
    try {
      const response = await fetch('/api/dashboard/chapters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          novelId: parseInt(novelId),
          title,
          content,
          isPublished: false,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setLastSaved(new Date())

        if (clearFormAfterSave) {
          // Clear form for next chapter
          setTitle('')
          setContent('')
          setLastSaved(null)

          // Refresh chapter list
          const novelResponse = await fetch(`/api/dashboard/novels/${novelId}`)
          if (novelResponse.ok) {
            const novelData = await novelResponse.json()
            setNovel(novelData.novel)
            setChapters(novelData.novel.chapters || [])
          }
        }
      } else {
        const data = await response.json()
        alert(`Failed to save: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to save draft:', error)
      alert('Failed to save draft')
    } finally {
      setSaving(false)
    }
  }, [novelId, title, content])

  // Auto-save
  useEffect(() => {
    if (!title.trim() || !content.trim()) return

    const timer = setInterval(() => {
      saveDraft()
    }, AUTO_SAVE_INTERVAL)

    return () => clearInterval(timer)
  }, [title, content, saveDraft])

  // Publish chapter
  const handlePublish = async () => {
    if (!title.trim()) {
      alert('Please enter a chapter title')
      return
    }

    if (!content.trim()) {
      alert('Please enter chapter content')
      return
    }

    if (isOverLimit) {
      alert(`Chapter exceeds maximum character limit of ${CHAR_LIMIT.toLocaleString()} characters`)
      return
    }

    setPublishing(true)
    try {
      const response = await fetch('/api/dashboard/chapters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          novelId: parseInt(novelId),
          title,
          content,
          isPublished: true,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Clear form for next chapter
        setTitle('')
        setContent('')
        setLastSaved(null)

        // Refresh chapter list
        const novelResponse = await fetch(`/api/dashboard/novels/${novelId}`)
        if (novelResponse.ok) {
          const novelData = await novelResponse.json()
          setNovel(novelData.novel)
          setChapters(novelData.novel.chapters || [])
        }
      } else {
        const data = await response.json()
        alert(`Failed to publish: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to publish:', error)
      alert('An error occurred')
    } finally {
      setPublishing(false)
    }
  }

  // Prevent input if over limit
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value

    if (newContent.length <= CHAR_LIMIT) {
      setContent(newContent)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            href={`/dashboard/novels/${novelId}/chapters`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Chapters
          </Link>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Left Column: Chapter List */}
          <div className="w-60 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                {novel?.title || 'Loading...'}
              </h3>
              <div className="text-xs text-gray-500 mb-4">
                {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}
              </div>

              {/* Chapter Navigation */}
              <div className="space-y-1 max-h-96 overflow-y-auto mb-3">
                {chapters.map((chapter) => (
                  <Link
                    key={chapter.id}
                    href={`/dashboard/write/${chapter.id}`}
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                  >
                    <div className="font-medium">CH {chapter.chapterNumber}</div>
                    <div className="text-xs text-gray-500 truncate">{chapter.title}</div>
                  </Link>
                ))}
                {/* Current New Chapter Indicator */}
                <div className="px-3 py-2 bg-indigo-50 border border-indigo-200 rounded">
                  <div className="text-sm font-medium text-indigo-600">
                    New Chapter
                  </div>
                  <div className="text-xs text-indigo-500">Currently editing</div>
                </div>
              </div>

              {/* Add Next Chapter Button */}
              <button
                onClick={() => {
                  if (!title.trim() || !content.trim()) {
                    alert('Please write some content before adding a new chapter')
                    return
                  }
                  // Save current chapter and clear form for next chapter
                  saveDraft(true)
                }}
                disabled={saving}
                className="w-full px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : '+ Add Next Chapter'}
              </button>
            </div>
          </div>

          {/* Right Column: Editor */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6">
            {/* Character Count & Progress Bar - AT THE TOP */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <CharacterCountProgress current={charCount} max={CHAR_LIMIT} />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
              <button
                onClick={() => saveDraft(false)}
                disabled={saving || !title.trim() || !content.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                onClick={handlePublish}
                disabled={publishing || isOverLimit || !title.trim() || !content.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Send size={18} />
                {publishing ? 'Publishing...' : 'Publish Chapter'}
              </button>

              {lastSaved && (
                <span className="text-sm text-gray-500 ml-auto">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Chapter Title */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Chapter Title (e.g., Chapter 1: The Beginning)"
                className="w-full px-0 py-2 text-2xl font-bold border-0 focus:outline-none focus:ring-0 bg-transparent placeholder-gray-400"
                maxLength={TITLE_LIMIT}
              />
              <div className="text-xs text-gray-500 mt-2">
                {title.length} / {TITLE_LIMIT} characters
              </div>
            </div>

            {/* Chapter Content */}
            <div>
              <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="Start writing your chapter here..."
                className="w-full min-h-screen text-lg leading-relaxed focus:outline-none resize-none font-serif border-0 focus:ring-0"
                style={{ fontSize: '18px', lineHeight: '1.8', height: 'auto' }}
                rows={30}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
