// src/app/search/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Footer from '@/components/shared/Footer'
import SearchInput from '@/components/search/SearchInput'
import SearchFilters, { type NovelType } from '@/components/search/SearchFilters'
import EnhancedBookCard from '@/components/search/EnhancedBookCard'
import { BookCardSkeletonList } from '@/components/search/BookCardSkeleton'

interface Tag {
  id: string
  name: string
  slug: string
}

interface Category {
  id: number
  name: string
  slug: string
}

interface Novel {
  id: number
  title: string
  slug: string
  blurb: string
  coverImage: string
  authorName: string
  status: string
  viewCount: number
  averageRating?: number | null
  totalRatings: number
  category: Category
  tags: Tag[]
  tagsCount: number
  chaptersCount: number
  likesCount: number // For shorts, this represents recommendCount
  isShortNovel?: boolean
}

interface SearchResponse {
  success: boolean
  data?: {
    novels: Novel[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasMore: boolean
    }
    query: string | null
    category: string | null
    tags: string | null
    status: string | null
    sort: string
  }
  error?: string
}

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL参数 - 支持 genre 或 category（向后兼容）
  const queryParam = searchParams.get('q') || ''
  const categoryParam = searchParams.get('genre') || searchParams.get('category') || ''
  const tagsParam = searchParams.get('tags') || ''
  const statusParam = searchParams.get('status') || ''
  const sortParam = searchParams.get('sort') || 'hot'
  const pageParam = parseInt(searchParams.get('page') || '1')
  const typeParam = (searchParams.get('type') || 'novels') as NovelType

  // 状态
  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [selectedCategory, setSelectedCategory] = useState(categoryParam)
  const [selectedTags, setSelectedTags] = useState<string[]>(
    tagsParam ? tagsParam.split(',').filter(Boolean) : []
  )
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    statusParam ? statusParam.split(',').filter(Boolean) : []
  )
  const [selectedSort, setSelectedSort] = useState(sortParam)
  const [currentPage, setCurrentPage] = useState(pageParam)
  const [selectedType, setSelectedType] = useState<NovelType>(typeParam)

  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  })

  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // 同步URL参数到state（当从外部链接进入时）
  useEffect(() => {
    setSearchQuery(queryParam)
    setSelectedCategory(categoryParam)
    setSelectedTags(tagsParam ? tagsParam.split(',').filter(Boolean) : [])
    setSelectedStatuses(statusParam ? statusParam.split(',').filter(Boolean) : [])
    setSelectedSort(sortParam)
    setCurrentPage(pageParam)
    setSelectedType(typeParam)
  }, [queryParam, categoryParam, tagsParam, statusParam, sortParam, pageParam, typeParam])

  // 执行搜索
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (queryParam) params.set('q', queryParam)
        if (categoryParam) params.set('genre', categoryParam)
        if (tagsParam) params.set('tags', tagsParam)
        if (statusParam) params.set('status', statusParam)
        if (sortParam) params.set('sort', sortParam)
        params.set('page', pageParam.toString())
        params.set('limit', '20')
        params.set('type', typeParam) // Add type filter

        const response = await fetch(`/api/search?${params.toString()}`)
        const data: SearchResponse = await response.json()

        if (data.success && data.data) {
          setNovels(data.data.novels)
          setPagination(data.data.pagination)
        } else {
          setError(data.error || 'Failed to fetch search results')
          setNovels([])
        }
      } catch (err) {
        setError('An error occurred while searching')
        setNovels([])
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [queryParam, categoryParam, tagsParam, statusParam, sortParam, pageParam, typeParam])

  // 更新URL参数
  const updateSearchParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // 如果设置了 genre，删除旧的 category 参数（向后兼容）
    if (updates.genre !== undefined) {
      params.delete('category')
    }

    // 筛选条件改变时重置页码
    if (updates.genre !== undefined || updates.tags !== undefined ||
        updates.status !== undefined || updates.sort !== undefined || updates.q !== undefined) {
      params.set('page', '1')
    }

    router.push(`/search?${params.toString()}`)
  }

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    updateSearchParams({ q: query, page: '1' })
  }

  // 处理分类变更
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    updateSearchParams({ genre: category, page: '1' })
  }

  // 处理标签变更
  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags)
    updateSearchParams({ tags: tags.join(','), page: '1' })
  }

  // 处理状态变更
  const handleStatusesChange = (statuses: string[]) => {
    setSelectedStatuses(statuses)
    updateSearchParams({ status: statuses.join(','), page: '1' })
  }

  // 处理排序变更
  const handleSortChange = (sort: string) => {
    setSelectedSort(sort)
    updateSearchParams({ sort, page: '1' })
  }

  // 处理类型变更
  const handleTypeChange = (type: NovelType) => {
    setSelectedType(type)
    setSelectedCategory('') // Clear category when switching types
    updateSearchParams({ type, genre: '', page: '1' })
  }

  // 清除所有筛选
  const handleClearAll = () => {
    setSelectedCategory('')
    setSelectedTags([])
    setSelectedStatuses([])
    setSearchQuery('')
    router.push(`/search?type=${selectedType}`)
  }

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateSearchParams({ page: page.toString() })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="flex-1 bg-gray-50">
      {/* 搜索头部 - 移动端更紧凑 */}
      <div className="bg-white">
        <div className="container mx-auto px-3 sm:px-4 max-w-7xl py-3 sm:py-6 md:py-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4 md:mb-6">
            Search Novels
          </h1>

          {/* 搜索框 */}
          <SearchInput
            initialValue={searchQuery}
            onSearch={handleSearch}
            placeholder="Search by title, author..."
          />
        </div>
      </div>

      {/* 筛选栏 */}
      <SearchFilters
        selectedCategory={selectedCategory}
        selectedTags={selectedTags}
        selectedStatuses={selectedStatuses}
        selectedSort={selectedSort}
        selectedType={selectedType}
        onCategoryChange={handleCategoryChange}
        onTagsChange={handleTagsChange}
        onStatusesChange={handleStatusesChange}
        onSortChange={handleSortChange}
        onTypeChange={handleTypeChange}
        onClearAll={handleClearAll}
      />

      {/* 搜索结果 - 移动端更紧凑 */}
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl py-3 sm:py-6 md:py-8">
        {/* 搜索结果信息 */}
        {!loading && (
          <div className="mb-3 sm:mb-6 text-gray-600">
            <p className="text-xs sm:text-sm md:text-base">
              {pagination.total.toLocaleString()}{' '}
              {pagination.total === 1 ? 'novel' : 'novels'} found
            </p>
          </div>
        )}

        {/* 加载状态 - 骨架屏 */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 md:gap-6">
            <BookCardSkeletonList count={8} />
          </div>
        )}

        {/* 错误状态 */}
        {error && !loading && (
          <div className="text-center py-10 sm:py-20">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">⚠️</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-sm sm:text-base text-gray-600">{error}</p>
          </div>
        )}

        {/* 搜索结果网格 - 移动端单列更紧凑 */}
        {!loading && !error && novels.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-8">
              {novels.map((novel) => (
                <EnhancedBookCard
                  key={novel.id}
                  id={novel.id}
                  title={novel.title}
                  slug={novel.slug}
                  coverImage={novel.coverImage}
                  authorName={novel.authorName}
                  blurb={novel.blurb}
                  viewCount={novel.viewCount}
                  averageRating={novel.averageRating}
                  totalRatings={novel.totalRatings}
                  status={novel.status}
                  category={novel.category}
                  tags={novel.tags}
                  tagsCount={novel.tagsCount}
                  chaptersCount={novel.chaptersCount}
                  likesCount={novel.likesCount}
                  isShortNovel={novel.isShortNovel}
                />
              ))}
            </div>

            {/* 分页 - 移动端更紧凑 */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 sm:gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-base"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>

                <div className="flex gap-0.5 sm:gap-1">
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm md:text-base ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-base"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* 无结果 */}
        {!loading && !error && novels.length === 0 && (
          <div className="text-center py-10 sm:py-20">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🔍</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No results found</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              Try different keywords or adjust your filters
            </p>
            <button
              onClick={handleClearAll}
              className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

export default function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Loading search...</p>
            </div>
          </div>
        }
      >
        <SearchContent />
      </Suspense>
      <Footer />
    </div>
  )
}
