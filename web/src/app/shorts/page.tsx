import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { SHORT_NOVEL_GENRES, getShortNovelGenreName, estimateReadingTime, formatReadingTime } from '@/lib/short-novel'
import ShortsPageJsonLd from '@/components/seo/ShortsPageJsonLd'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'

export const metadata: Metadata = {
  title: 'Short Novels - Quick Reads in 10-30 Minutes | Free Short Stories Online',
  description: 'Browse free short novels you can finish in one sitting. Complete stories in 10-30 minutes. Fantasy, romance, thriller, horror, mystery, sci-fi, and more genres. No subscription required.',
  keywords: [
    'short novel',
    'short story',
    'quick read',
    'free short story',
    'short story online',
    'complete story',
    'one-shot novel',
    'fantasy short story',
    'romance short story',
    'thriller short story',
    'horror short story',
    'mystery short story',
    'butternovel',
    'butter novel',
    'free reading',
  ],
  openGraph: {
    title: 'Short Novels - Free Quick Reads | ButterNovel',
    description: 'Discover free short novels you can finish in one sitting. Browse by genre: fantasy, romance, thriller, horror, mystery, and more.',
    type: 'website',
    url: `${baseUrl}/shorts`,
    siteName: 'ButterNovel',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Short Novels - Quick Reads in 10-30 Minutes',
    description: 'Free short stories you can finish in one sitting. No subscription needed.',
    site: '@butternovel',
  },
  alternates: {
    canonical: `${baseUrl}/shorts`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
    },
  },
}

interface Props {
  searchParams: Promise<{
    genre?: string
    page?: string
    sort?: string
  }>
}

interface ShortNovelListItem {
  id: number
  title: string
  slug: string
  blurb: string
  readingPreview: string | null
  shortNovelGenre: string | null
  wordCount: number
  viewCount: number
  likeCount: number
  averageRating: number | null
  createdAt: Date
}

async function getShortNovels(genre?: string, page: number = 1, sort: string = 'popular'): Promise<{
  novels: ShortNovelListItem[]
  total: number
  totalPages: number
  currentPage: number
}> {
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const where: any = {
    isShortNovel: true,
    isPublished: true,
    isBanned: false,
  }

  if (genre) {
    where.shortNovelGenre = genre
  }

  const orderBy: any = sort === 'latest'
    ? { createdAt: 'desc' }
    : sort === 'recommend'
    ? { likeCount: 'desc' } // Recommend uses likeCount (will be replaced with recommendCount)
    : { viewCount: 'desc' } // popular (default)

  const [novels, total] = await Promise.all([
    withRetry(
      () => prisma.novel.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          blurb: true,
          readingPreview: true,
          shortNovelGenre: true,
          wordCount: true,
          viewCount: true,
          likeCount: true,
          averageRating: true,
          createdAt: true,
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      { operationName: 'Get short novels list' }
    ) as Promise<ShortNovelListItem[]>,
    withRetry(
      () => prisma.novel.count({ where }),
      { operationName: 'Count short novels' }
    ) as Promise<number>,
  ])

  return {
    novels,
    total,
    totalPages: Math.ceil(total / pageSize),
    currentPage: page,
  }
}

export default async function ShortsPage({ searchParams }: Props) {
  const params = await searchParams
  const genre = params.genre
  const page = parseInt(params.page || '1')
  const sort = params.sort || 'popular'

  const { novels, total, totalPages, currentPage } = await getShortNovels(genre, page, sort)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO: Structured Data */}
      <ShortsPageJsonLd />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Short Novels
          </h1>
          <p className="text-blue-100 text-lg">
            Quick reads you can finish in 10-30 minutes
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-8">
          {/* Genre Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">Genre</label>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/shorts?sort=${sort}`}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !genre
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </Link>
              {SHORT_NOVEL_GENRES.map((g) => (
                <Link
                  key={g.id}
                  href={`/shorts?genre=${g.id}&sort=${sort}`}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    genre === g.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Sort Filter - Separate Row */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <label className="text-sm font-medium text-gray-700">Sort by</label>
            <div className="flex gap-2">
              {[
                { value: 'popular', label: 'Popular' },
                { value: 'latest', label: 'Latest' },
                { value: 'recommend', label: 'Recommended' },
              ].map((option) => (
                <Link
                  key={option.value}
                  href={`/shorts?${genre ? `genre=${genre}&` : ''}sort=${option.value}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    sort === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Found <span className="font-semibold text-gray-900">{total}</span> short novels
            {genre && ` in ${getShortNovelGenreName(genre)}`}
          </p>
        </div>

        {/* Novels Grid */}
        {novels.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No short novels found</h2>
            <p className="text-gray-500">Try a different genre or check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {novels.map((novel: any) => {
              const readingTime = estimateReadingTime(novel.wordCount)
              const preview = novel.readingPreview || novel.blurb

              return (
                <Link
                  key={novel.id}
                  href={`/shorts/${novel.slug}`}
                  className="group flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all h-full"
                >
                  <div className="p-5 flex flex-col flex-1">
                    {/* Genre & Time */}
                    <div className="flex items-center justify-between mb-3">
                      {novel.shortNovelGenre && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {getShortNovelGenreName(novel.shortNovelGenre)}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatReadingTime(readingTime)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                      {novel.title}
                    </h3>

                    {/* Preview */}
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                      {preview}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {novel.viewCount.toLocaleString()}
                        </span>
                        {novel.averageRating && novel.averageRating > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {novel.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <span className="text-blue-600 font-semibold text-sm">
                        Read →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {currentPage > 1 && (
              <Link
                href={`/shorts?${genre ? `genre=${genre}&` : ''}sort=${sort}&page=${currentPage - 1}`}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </Link>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
              .map((page, index, arr) => {
                const showEllipsis = index > 0 && page - arr[index - 1] > 1
                return (
                  <span key={page} className="flex items-center gap-2">
                    {showEllipsis && <span className="px-2">...</span>}
                    <Link
                      href={`/shorts?${genre ? `genre=${genre}&` : ''}sort=${sort}&page=${page}`}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </Link>
                  </span>
                )
              })}

            {currentPage < totalPages && (
              <Link
                href={`/shorts?${genre ? `genre=${genre}&` : ''}sort=${sort}&page=${currentPage + 1}`}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
