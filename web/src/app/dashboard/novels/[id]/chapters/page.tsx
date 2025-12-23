'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, FileText, Eye, Send, Archive } from 'lucide-react'

type Chapter = {
  id: number
  chapterNumber: number
  title: string
  wordCount: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

type Novel = {
  id: number
  title: string
  slug: string
}

export default function ChaptersPage() {
  const params = useParams()
  const router = useRouter()
  const novelId = params.id as string

  const [novel, setNovel] = useState<Novel | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [toggling, setToggling] = useState<number | null>(null)

  useEffect(() => {
    fetchNovel()
  }, [novelId])

  const fetchNovel = async () => {
    try {
      const response = await fetch(`/api/dashboard/novels/${novelId}`)
      if (response.ok) {
        const data = await response.json()
        setNovel(data.novel)
        setChapters(data.novel.chapters || [])
      } else {
        alert('Failed to load novel')
        router.push('/dashboard/novels')
      }
    } catch (error) {
      console.error('Failed to fetch novel:', error)
      alert('An error occurred')
      router.push('/dashboard/novels')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePublish = async (id: number, currentStatus: boolean) => {
    const action = currentStatus ? 'unpublish' : 'publish'
    if (!confirm(`Are you sure you want to ${action} this chapter?`)) {
      return
    }

    setToggling(id)
    try {
      const response = await fetch(`/api/dashboard/chapters/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: !currentStatus,
        }),
      })

      if (response.ok) {
        // Refresh chapters
        await fetchNovel()
        alert(`Chapter ${action}ed successfully`)
      } else {
        const data = await response.json()
        alert(`Failed to ${action} chapter: ${data.error}`)
      }
    } catch (error) {
      console.error(`Failed to ${action} chapter:`, error)
      alert('An error occurred')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (id: number, chapterNumber: number) => {
    if (!confirm(`Are you sure you want to delete Chapter ${chapterNumber}? This action cannot be undone.`)) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/dashboard/chapters/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh chapters
        await fetchNovel()
        alert('Chapter deleted successfully')
      } else {
        const data = await response.json()
        alert(`Failed to delete chapter: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to delete chapter:', error)
      alert('An error occurred while deleting the chapter')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  if (!novel) {
    return null
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/novels"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Novels
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{novel.title}</h1>
            <p className="text-gray-600">Manage chapters for this novel</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/novels/${novel.slug}`}
              target="_blank"
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <Eye size={20} />
              View Novel
            </Link>
            <Link
              href={`/dashboard/novels/${novelId}/chapters/new`}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Plus size={20} />
              Add Chapter
            </Link>
          </div>
        </div>
      </div>

      {/* Chapters List */}
      {chapters.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Chapter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Words
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider w-80">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {chapters.map((chapter) => (
                  <tr key={chapter.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{chapter.chapterNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate">
                        {chapter.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <FileText size={14} />
                        {chapter.wordCount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          chapter.isPublished
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {chapter.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(chapter.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-80">
                      <div className="flex items-center justify-end gap-2 flex-nowrap">
                        <Link
                          href={`/dashboard/write/${chapter.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium whitespace-nowrap"
                        >
                          <Edit size={14} />
                          Edit
                        </Link>
                        <Link
                          href={`/novels/${novel.slug}/chapters/${chapter.chapterNumber}`}
                          target="_blank"
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors font-medium whitespace-nowrap"
                        >
                          <Eye size={14} />
                          View
                        </Link>
                        <button
                          onClick={() => handleTogglePublish(chapter.id, chapter.isPublished)}
                          disabled={toggling === chapter.id}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors font-medium disabled:opacity-50 whitespace-nowrap ${
                            chapter.isPublished
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {chapter.isPublished ? <Archive size={14} /> : <Send size={14} />}
                          {toggling === chapter.id
                            ? 'Loading...'
                            : chapter.isPublished
                            ? 'Unpublish'
                            : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDelete(chapter.id, chapter.chapterNumber)}
                          disabled={deleting === chapter.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium disabled:opacity-50 whitespace-nowrap"
                        >
                          <Trash2 size={14} />
                          {deleting === chapter.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No chapters yet</h3>
          <p className="text-gray-600 mb-6">
            Start writing by adding your first chapter
          </p>
          <Link
            href={`/dashboard/novels/${novelId}/chapters/new`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            Add First Chapter
          </Link>
        </div>
      )}
    </div>
  )
}
