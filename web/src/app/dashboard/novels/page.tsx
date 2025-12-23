'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Edit, Trash2, Eye, FileText, MoreHorizontal, BookOpen } from 'lucide-react'

type Novel = {
  id: number
  title: string
  slug: string
  coverImage: string
  status: string
  isPublished: boolean
  categoryName: string
  totalChapters: number
  viewCount: number
  likeCount: number
  averageRating: number | null
  updatedAt: string
}

export default function NovelsPage() {
  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [publishing, setPublishing] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'published' | 'drafts'>('all')

  useEffect(() => {
    fetchNovels()
  }, [])

  const fetchNovels = async () => {
    try {
      const response = await fetch('/api/dashboard/novels')
      if (response.ok) {
        const data = await response.json()
        setNovels(data.novels)
      }
    } catch (error) {
      console.error('Failed to fetch novels:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePublish = async (id: number, currentStatus: boolean, title: string) => {
    const action = currentStatus ? 'unpublish' : 'publish'
    const confirmMessage = currentStatus
      ? `Are you sure you want to unpublish "${title}"? It will no longer be visible to readers.`
      : `Are you sure you want to publish "${title}"? It will be visible to all readers.`

    if (!confirm(confirmMessage)) {
      return
    }

    setPublishing(id)
    try {
      const response = await fetch(`/api/dashboard/novels/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: !currentStatus,
        }),
      })

      if (response.ok) {
        setNovels(
          novels.map((novel) =>
            novel.id === id ? { ...novel, isPublished: !currentStatus } : novel
          )
        )
        alert(`Novel ${action}ed successfully`)
      } else {
        const data = await response.json()
        alert(`Failed to ${action} novel: ${data.error}`)
      }
    } catch (error) {
      console.error(`Failed to ${action} novel:`, error)
      alert(`An error occurred while ${action}ing the novel`)
    } finally {
      setPublishing(null)
    }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/dashboard/novels/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNovels(novels.filter((novel) => novel.id !== id))
        alert('Novel deleted successfully')
      } else {
        const data = await response.json()
        alert(`Failed to delete novel: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to delete novel:', error)
      alert('An error occurred while deleting the novel')
    } finally {
      setDeleting(null)
    }
  }

  const filteredNovels = novels.filter((novel) => {
    if (filter === 'published') return novel.isPublished
    if (filter === 'drafts') return !novel.isPublished
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Stories</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredNovels.length} {filteredNovels.length === 1 ? 'story' : 'stories'}
            </p>
          </div>
          <Link
            href="/dashboard/upload"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus size={18} />
            New Story
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`pb-3 px-4 border-b-2 font-medium transition-colors ${
              filter === 'all'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All ({novels.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`pb-3 px-4 border-b-2 font-medium transition-colors ${
              filter === 'published'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Published ({novels.filter((n) => n.isPublished).length})
          </button>
          <button
            onClick={() => setFilter('drafts')}
            className={`pb-3 px-4 border-b-2 font-medium transition-colors ${
              filter === 'drafts'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Drafts ({novels.filter((n) => !n.isPublished).length})
          </button>
        </div>

        {/* Table */}
        {filteredNovels.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Story
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chapters
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredNovels.map((novel) => (
                  <tr key={novel.id} className="hover:bg-gray-50 transition-colors">
                    {/* Story */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                          <Image
                            src={novel.coverImage}
                            alt={novel.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <Link
                            href={`/dashboard/novels/${novel.id}/chapters`}
                            className="font-medium text-gray-900 hover:text-indigo-600"
                          >
                            {novel.title}
                          </Link>
                          <p className="text-sm text-gray-500">{novel.categoryName}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            novel.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {novel.isPublished ? 'Published' : 'Draft'}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            novel.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {novel.status === 'COMPLETED' ? 'Completed' : 'Ongoing'}
                        </span>
                      </div>
                    </td>

                    {/* Chapters */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-700">
                        <FileText size={16} className="text-gray-400" />
                        <span className="text-sm font-medium">{novel.totalChapters}</span>
                      </div>
                    </td>

                    {/* Views */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-700">
                        <Eye size={16} className="text-gray-400" />
                        <span className="text-sm font-medium">{novel.viewCount.toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(novel.updatedAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/novels/${novel.slug}`}
                          target="_blank"
                          className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/novels/${novel.id}/chapters`}
                          className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                        >
                          Chapters
                        </Link>
                        <Link
                          href={`/dashboard/novels/${novel.id}/edit`}
                          className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleTogglePublish(novel.id, novel.isPublished, novel.title)}
                          disabled={publishing === novel.id}
                          className={`text-sm font-medium transition-colors disabled:opacity-50 ${
                            novel.isPublished
                              ? 'text-gray-600 hover:text-yellow-600'
                              : 'text-gray-600 hover:text-green-600'
                          }`}
                        >
                          {publishing === novel.id
                            ? '...'
                            : novel.isPublished
                            ? 'Unpublish'
                            : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDelete(novel.id, novel.title)}
                          disabled={deleting === novel.id}
                          className="text-sm text-gray-600 hover:text-red-600 font-medium transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 px-6 py-20 text-center">
            <div className="text-gray-400 mb-4">
              <BookOpen size={48} strokeWidth={1.5} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stories found</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all'
                ? 'Get started by creating your first story'
                : filter === 'published'
                ? 'You have no published stories yet'
                : 'You have no draft stories'}
            </p>
            {filter === 'all' && (
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Plus size={18} />
                Create Story
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
