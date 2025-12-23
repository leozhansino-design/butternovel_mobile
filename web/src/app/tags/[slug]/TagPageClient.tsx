'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Tag {
  id: string
  name: string
  slug: string
  count?: number
}

interface Novel {
  id: number
  title: string
  slug: string
  coverImage: string
  blurb: string
  authorName: string
  viewCount: number
  bookmarkCount: number
  totalChapters: number
  status: string
  hotScore: number
  averageRating?: number
  totalRatings: number
  category: {
    id: number
    name: string
    slug: string
  }
  tags: Tag[]
}

interface TagSearchData {
  novels: Novel[]
  relatedTags: Tag[]
  selectedTags: Tag[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  sort: string
}

export default function TagPageClient({ slug }: { slug: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<TagSearchData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sort = searchParams.get('sort') || 'hot'
  const page = parseInt(searchParams.get('page') || '1')
  const additionalTags = searchParams.get('tags') || ''

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        const queryParams = new URLSearchParams()
        if (additionalTags) queryParams.set('tags', additionalTags)
        queryParams.set('sort', sort)
        queryParams.set('page', page.toString())

        const response = await fetch(`/api/tags/${slug}?${queryParams}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch novels')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [slug, sort, page, additionalTags])

  const handleSortChange = (newSort: string) => {
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('sort', newSort)
    newParams.delete('page')
    router.push(`/tags/${slug}?${newParams}`)
  }

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('page', newPage.toString())
    router.push(`/tags/${slug}?${newParams}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRefineTag = (tag: Tag) => {
    const currentTags = additionalTags ? additionalTags.split(',') : []

    if (currentTags.includes(tag.slug)) {
      const newTags = currentTags.filter(t => t !== tag.slug)
      const newParams = new URLSearchParams(searchParams.toString())

      if (newTags.length > 0) {
        newParams.set('tags', newTags.join(','))
      } else {
        newParams.delete('tags')
      }
      newParams.delete('page')

      router.push(`/tags/${slug}?${newParams}`)
    } else {
      const newTags = [...currentTags, tag.slug]
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set('tags', newTags.join(','))
      newParams.delete('page')

      router.push(`/tags/${slug}?${newParams}`)
    }
  }

  const removeSelectedTag = (tagSlug: string) => {
    const currentTags = additionalTags ? additionalTags.split(',') : []
    const newTags = currentTags.filter(t => t !== tagSlug)
    const newParams = new URLSearchParams(searchParams.toString())

    if (newTags.length > 0) {
      newParams.set('tags', newTags.join(','))
    } else {
      newParams.delete('tags')
    }
    newParams.delete('page')

    router.push(`/tags/${slug}?${newParams}`)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4">
                <div className="h-64 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-700 mb-6">{error}</p>
        <Link href="/" className="text-indigo-600 hover:underline">
          Go back to home
        </Link>
      </div>
    )
  }

  if (!data) return null

  const selectedTagsList = data.selectedTags || []
  const mainTag = selectedTagsList[0]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 capitalize">
          {mainTag?.name || slug} Stories
        </h1>

        {/* Selected Tags */}
        {selectedTagsList.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTagsList.slice(1).map(tag => (
              <span
                key={tag.slug}
                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-medium"
              >
                {tag.name}
                <button
                  onClick={() => removeSelectedTag(tag.slug)}
                  className="ml-1 hover:bg-indigo-700 rounded-full p-0.5"
                  aria-label={`Remove ${tag.name}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Refine by Tag */}
        {data.relatedTags.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">Refine by tag:</h2>
            <div className="flex flex-wrap gap-2">
              {data.relatedTags.map(tag => (
                <button
                  key={tag.slug}
                  onClick={() => handleRefineTag(tag)}
                  className="px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                >
                  {tag.name} <span className="text-gray-500">({tag.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats and Sort */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-lg font-semibold text-gray-700">
            {data.total.toLocaleString()} {data.total === 1 ? 'Story' : 'Stories'}
          </p>

          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700">
              Sort by:
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="hot">Hot</option>
              <option value="bookmarks">Bookmarks</option>
              <option value="views">Views</option>
            </select>
          </div>
        </div>
      </div>

      {/* Novels Grid */}
      {data.novels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">No novels found with these tags.</p>
          <Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline">
            Browse all novels
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
            {data.novels.map(novel => (
              <Link key={novel.id} href={`/novels/${novel.slug}`} className="group">
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={novel.coverImage}
                      alt={novel.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-indigo-600">
                      {novel.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">{novel.authorName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>👁 {novel.viewCount.toLocaleString()}</span>
                      <span>📚 {novel.totalChapters}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, data.totalPages))].map((_, i) => {
                  let pageNum
                  if (data.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= data.totalPages - 2) {
                    pageNum = data.totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === data.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
