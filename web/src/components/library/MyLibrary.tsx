// src/components/library/MyLibrary.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type NovelInLibrary = {
  id: number
  title: string
  slug: string
  coverImage: string
  category: string
  status: 'ONGOING' | 'COMPLETED'
  totalChapters: number
  addedAt: string
  // 阅读进度
  lastReadChapter?: number | null
  lastReadChapterTitle?: string | null
  readChapters?: number
}

type MyLibraryProps = {
  onClose: () => void
}

export default function MyLibrary({ onClose }: MyLibraryProps) {
  const router = useRouter()
  const [novels, setNovels] = useState<NovelInLibrary[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'progress'>('recent')
  const [filterStatus, setFilterStatus] = useState<'all' | 'ONGOING' | 'COMPLETED'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  // ✅ 将 fetchLibrary 逻辑移到 useEffect 内部，避免依赖问题
  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/library')
        const data = await res.json()
        setNovels(data.novels || [])
      } catch (error) {
        console.error('Failed to fetch library:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLibrary()
  }, [])

  const handleNovelClick = (novel: NovelInLibrary) => {
    if (isSelectionMode) {
      toggleSelection(novel.id)
      return
    }

    // 如果有阅读历史,跳转到阅读器
    if (novel.lastReadChapter) {
      router.push(`/novels/${novel.slug}/chapters/${novel.lastReadChapter}`)
    } else {
      // 没有阅读历史,跳转到详情页
      router.push(`/novels/${novel.slug}`)
    }
    onClose()
  }

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedNovels.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredAndSortedNovels.map(n => n.id)))
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return

    if (!confirm(`Remove ${selectedIds.size} ${selectedIds.size === 1 ? 'book' : 'books'} from your library?`)) {
      return
    }

    try {
      await Promise.all(
        Array.from(selectedIds).map(novelId =>
          fetch('/api/library', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novelId })
          })
        )
      )

      setNovels(novels.filter(n => !selectedIds.has(n.id)))
      setSelectedIds(new Set())
      setIsSelectionMode(false)
    } catch (error) {
      console.error('Failed to delete from library:', error)
      alert('Failed to remove books from library')
    }
  }

  // 筛选和排序
  const filteredAndSortedNovels = novels
    .filter(novel => filterStatus === 'all' || novel.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      } else {
        // 按阅读进度排序
        const progressA = a.readChapters || 0
        const progressB = b.readChapters || 0
        return progressB - progressA
      }
    })

  // Skeleton Loading - 结构立即显示
  if (loading) {
    return (
      <div className="h-full flex flex-col">
        {/* Header - 立即显示 */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-100 rounded mt-2 animate-pulse"></div>
            </div>
            <div className="h-10 w-20 bg-gray-100 rounded-lg animate-pulse"></div>
          </div>

          {/* Filters - 立即显示 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">Sort:</span>
              <div className="h-9 w-36 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">Filter:</span>
              <div className="h-9 w-32 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Books Grid Skeleton - 立即显示边框 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
            {[...Array(14)].map((_, i) => (
              <div key={i} className="animate-pulse">
                {/* Cover placeholder */}
                <div className="aspect-[3/4] bg-gray-200 rounded-lg"></div>
                {/* Title placeholder */}
                <div className="mt-2 h-4 bg-gray-200 rounded w-full"></div>
                <div className="mt-1 h-3 bg-gray-100 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (novels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Your library is empty
        </h3>
        <p className="text-gray-600 mb-6">
          Start adding novels to your collection!
        </p>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
        >
          Browse Novels
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with filters */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Library</h2>
            <p className="text-sm text-gray-600 mt-1">
              {novels.length} {novels.length === 1 ? 'book' : 'books'} in your collection
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isSelectionMode && (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {selectedIds.size === filteredAndSortedNovels.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleBatchDelete}
                  disabled={selectedIds.size === 0}
                  className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete ({selectedIds.size})
                </button>
                <button
                  onClick={() => {
                    setIsSelectionMode(false)
                    setSelectedIds(new Set())
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
            {!isSelectionMode && (
              <button
                onClick={() => setIsSelectionMode(true)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Select
              </button>
            )}
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-4">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="recent">Recently Added</option>
              <option value="title">Title</option>
              <option value="progress">Reading Progress</option>
            </select>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-medium">Filter:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Books</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Books Grid - 缩小书籍尺寸 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
          {filteredAndSortedNovels.map((novel) => (
            <div
              key={novel.id}
              onClick={() => handleNovelClick(novel)}
              className={`group cursor-pointer relative ${isSelectionMode ? 'cursor-pointer' : ''}`}
            >
              {/* Selection checkbox */}
              {isSelectionMode && (
                <div className="absolute top-1.5 left-1.5 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(novel.id)}
                    onChange={() => toggleSelection(novel.id)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              {/* Cover Image - 添加懒加载 */}
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow bg-gray-100">
                <Image
                  src={novel.coverImage}
                  alt={novel.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 14vw"
                  loading="lazy"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Reading Progress Badge */}
                {novel.readChapters !== undefined && novel.readChapters > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                    <div className="text-[10px] text-white font-medium">
                      {novel.readChapters}/{novel.totalChapters}
                    </div>
                    <div className="mt-0.5 h-1 bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${(novel.readChapters / novel.totalChapters) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Book Info - 缩小字体 */}
              <h3 className="mt-1.5 font-medium text-xs text-gray-900 line-clamp-2 group-hover:text-amber-600 transition-colors leading-tight">
                {novel.title}
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {novel.category}
              </p>
              {/* 阅读进度文本 */}
              {novel.lastReadChapter && novel.lastReadChapterTitle && (
                <p className="text-[10px] text-amber-600 font-medium mt-1 truncate" title={`Chapter ${novel.lastReadChapter}: ${novel.lastReadChapterTitle}`}>
                  Ch {novel.lastReadChapter}: {novel.lastReadChapterTitle}...
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
