import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import ShortNovelReader from '@/components/shorts/ShortNovelReader'
import YouMayLike from '@/components/shorts/YouMayLike'
import ShortNovelJsonLd from '@/components/seo/ShortNovelJsonLd'
import { getShortNovelGenreName, estimateReadingTime, formatReadingTime } from '@/lib/short-novel'

interface Props {
  params: Promise<{ slug: string }>
}

// Short novel type
interface ShortNovelData {
  id: number
  title: string
  slug: string
  blurb: string
  shortNovelGenre: string | null
  wordCount: number
  viewCount: number
  likeCount: number
  averageRating: number | null
  authorName: string
  status: string
  chapters: Array<{
    id: number
    content: string
  }>
  ratings: Array<{
    id: string
    score: number
    review: string | null
    createdAt: Date
    user: {
      id: string
      name: string | null
      avatar: string | null
    }
  }>
  _count: {
    ratings: number
    comments: number
    likes: number
  }
}

// 获取短篇小说数据
async function getShortNovel(slug: string): Promise<ShortNovelData | null> {
  const novel = await withRetry(
    () => prisma.novel.findFirst({
      where: {
        slug,
        isShortNovel: true,
        isPublished: true,
        isBanned: false,
      },
      include: {
        chapters: {
          where: { isPublished: true },
          orderBy: { chapterNumber: 'asc' },
          take: 1, // 短篇小说只有一个章节
        },
        ratings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          }
        },
        _count: {
          select: {
            ratings: true,
            comments: true,
            likes: true,
          }
        }
      }
    }),
    { operationName: 'Get short novel by slug' }
  ) as ShortNovelData | null

  return novel
}

// Related short novel type
interface RelatedShortNovel {
  id: number
  title: string
  slug: string
  blurb: string
  shortNovelGenre: string | null
  wordCount: number
  viewCount: number
  likeCount: number
  averageRating: number | null
}

// 获取相关推荐短篇小说 - 混合推荐算法
// 4 novels from same genre + 6 novels from other genres (random)
async function getRelatedShorts(currentNovelId: number, genre: string | null): Promise<RelatedShortNovel[]> {
  // Get same genre novels (up to 4)
  const sameGenrePromise = genre
    ? withRetry(
        () => prisma.novel.findMany({
          where: {
            isShortNovel: true,
            isPublished: true,
            isBanned: false,
            id: { not: currentNovelId },
            shortNovelGenre: genre,
          },
          select: {
            id: true,
            title: true,
            slug: true,
            blurb: true,
            shortNovelGenre: true,
            wordCount: true,
            viewCount: true,
            likeCount: true,
            averageRating: true,
          },
          orderBy: { viewCount: 'desc' },
          take: 4,
        }),
        { operationName: 'Get same genre short novels' }
      )
    : Promise.resolve([])

  // Get random novels from other genres (using raw query for RANDOM())
  const otherGenresPromise = genre
    ? withRetry(
        () => prisma.$queryRaw<RelatedShortNovel[]>`
          SELECT
            id,
            title,
            slug,
            blurb,
            "shortNovelGenre",
            "wordCount",
            "viewCount",
            "likeCount",
            "averageRating"
          FROM "Novel"
          WHERE "isShortNovel" = true
            AND "isPublished" = true
            AND "isBanned" = false
            AND id != ${currentNovelId}
            AND "shortNovelGenre" != ${genre}
          ORDER BY RANDOM()
          LIMIT 6
        `,
        { operationName: 'Get other genre short novels' }
      )
    : withRetry(
        () => prisma.$queryRaw<RelatedShortNovel[]>`
          SELECT
            id,
            title,
            slug,
            blurb,
            "shortNovelGenre",
            "wordCount",
            "viewCount",
            "likeCount",
            "averageRating"
          FROM "Novel"
          WHERE "isShortNovel" = true
            AND "isPublished" = true
            AND "isBanned" = false
            AND id != ${currentNovelId}
          ORDER BY RANDOM()
          LIMIT 6
        `,
        { operationName: 'Get random short novels' }
      )

  const [sameGenre, otherGenres] = await Promise.all([sameGenrePromise, otherGenresPromise])

  // Combine and return (same genre first, then others)
  const combined = [...(sameGenre as RelatedShortNovel[]), ...(otherGenres as RelatedShortNovel[])]

  // Remove duplicates (in case any)
  const seen = new Set<number>()
  return combined.filter(novel => {
    if (seen.has(novel.id)) return false
    seen.add(novel.id)
    return true
  })
}

// 增加浏览次数
async function incrementViewCount(novelId: number) {
  try {
    await prisma.novel.update({
      where: { id: novelId },
      data: { viewCount: { increment: 1 } },
    })
  } catch (error) {
    console.error('Failed to increment view count:', error)
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const novel = await getShortNovel(slug)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'

  if (!novel) {
    return {
      title: 'Short Novel Not Found | ButterNovel',
      description: 'The requested short novel could not be found. Browse our collection of free short stories.',
    }
  }

  const readingTime = estimateReadingTime(novel.wordCount)
  const genreName = novel.shortNovelGenre ? getShortNovelGenreName(novel.shortNovelGenre) : 'Short Novel'
  const fullDescription = novel.blurb.length > 155
    ? novel.blurb.substring(0, 155) + '...'
    : novel.blurb

  // Generate optimized title with genre and reading time
  const seoTitle = `${novel.title} - ${genreName} | ${formatReadingTime(readingTime)} Read`

  return {
    title: seoTitle,
    description: fullDescription,
    keywords: [
      'short novel',
      'short story',
      'quick read',
      `${formatReadingTime(readingTime)} read`,
      genreName.toLowerCase(),
      `${genreName.toLowerCase()} short story`,
      novel.title,
      novel.authorName,
      'free short novel',
      'free short story online',
      'butternovel',
      'butter novel',
      'complete story',
      'one-shot novel',
    ].filter(Boolean),
    authors: [{ name: novel.authorName }],
    openGraph: {
      title: `${novel.title} | Free ${genreName} Short Novel`,
      description: fullDescription,
      type: 'article',
      url: `${baseUrl}/shorts/${novel.slug}`,
      siteName: 'ButterNovel',
      locale: 'en_US',
      authors: [novel.authorName],
      tags: [genreName, 'Short Novel', 'Free Reading'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${novel.title} - ${genreName} Short Novel`,
      description: fullDescription,
      site: '@butternovel',
    },
    alternates: {
      canonical: `${baseUrl}/shorts/${novel.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
      },
    },
    other: {
      'reading-time': `${readingTime} min`,
      'word-count': novel.wordCount.toString(),
      'article:section': genreName,
    },
  }
}

export default async function ShortNovelPage({ params }: Props) {
  const { slug } = await params
  const novelData = await getShortNovel(slug)

  if (!novelData || novelData.chapters.length === 0) {
    notFound()
  }

  // TypeScript now knows novelData is not null after the check
  const novel = novelData as ShortNovelData

  // 获取相关推荐
  const relatedNovels = await getRelatedShorts(novel.id, novel.shortNovelGenre)

  // 增加浏览次数（异步，不阻塞页面渲染）
  incrementViewCount(novel.id)

  const chapter = novel.chapters[0]
  const readingTime = estimateReadingTime(novel.wordCount)
  const genreName = novel.shortNovelGenre ? getShortNovelGenreName(novel.shortNovelGenre) : ''

  // Split related novels - some for sidebar, some for bottom
  const sidebarNovels = relatedNovels.slice(0, 4)
  const bottomNovels = relatedNovels.slice(0, 6)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* SEO: Structured Data */}
      <ShortNovelJsonLd
        novel={{
          id: novel.id,
          title: novel.title,
          slug: novel.slug,
          blurb: novel.blurb,
          shortNovelGenre: novel.shortNovelGenre,
          wordCount: novel.wordCount,
          viewCount: novel.viewCount,
          authorName: novel.authorName,
          averageRating: novel.averageRating,
          ratingsCount: novel._count.ratings,
        }}
        readingTime={readingTime}
        genreName={genreName}
      />

      {/* Main Content Area with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Reader Area */}
          <main className="flex-1 lg:max-w-4xl">
            <ShortNovelReader
              novel={{
                id: novel.id,
                title: novel.title,
                slug: novel.slug,
                blurb: novel.blurb,
                shortNovelGenre: novel.shortNovelGenre,
                wordCount: novel.wordCount,
                viewCount: novel.viewCount,
                likeCount: novel.likeCount,
                averageRating: novel.averageRating,
                authorName: novel.authorName,
                status: novel.status,
                ratingsCount: novel._count.ratings,
                commentsCount: novel._count.comments,
              }}
              chapter={{
                id: chapter.id,
                content: chapter.content,
              }}
              ratings={novel.ratings}
              readingTime={readingTime}
            />
          </main>

          {/* Sidebar - You May Like (Desktop) */}
          <aside className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <YouMayLike novels={sidebarNovels} variant="sidebar" />
            </div>
          </aside>
        </div>

        {/* Bottom Recommendations */}
        {bottomNovels.length > 0 && (
          <div className="mt-12">
            <YouMayLike novels={bottomNovels} variant="bottom" />
          </div>
        )}
      </div>
    </div>
  )
}
