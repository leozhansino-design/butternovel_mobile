import { Metadata } from 'next'

/**
 * SEO 元数据生成工具
 * 为动态页面生成 Open Graph 和 Twitter Card 元数据
 */

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'

interface NovelMetadataParams {
  title: string
  blurb: string
  coverImage?: string
  authorName: string
  categoryName: string
  slug: string
}

/**
 * 生成小说详情页元数据
 */
export function generateNovelMetadata({
  title,
  blurb,
  coverImage,
  authorName,
  categoryName,
  slug,
}: NovelMetadataParams): Metadata {
  const pageUrl = `${baseUrl}/novels/${slug}`
  const description = blurb.length > 160 ? `${blurb.slice(0, 157)}...` : blurb
  const ogImage = coverImage || `${baseUrl}/og-image.png`

  return {
    title,
    description,

    keywords: [
      title,
      authorName,
      categoryName,
      'novel',
      'free novel',
      'read online',
      'web novel',
    ],

    authors: [{ name: authorName }],

    openGraph: {
      type: 'article',
      url: pageUrl,
      title,
      description,
      siteName: 'ButterNovel',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@butternovel',
    },

    alternates: {
      canonical: pageUrl,
    },
  }
}

interface ChapterMetadataParams {
  novelTitle: string
  chapterTitle: string
  chapterNumber: number
  novelSlug: string
  chapterId: number
  authorName: string
}

/**
 * 生成章节页元数据
 */
export function generateChapterMetadata({
  novelTitle,
  chapterTitle,
  chapterNumber,
  novelSlug,
  chapterId,
  authorName,
}: ChapterMetadataParams): Metadata {
  const pageUrl = `${baseUrl}/novels/${novelSlug}/chapter/${chapterId}`
  const fullTitle = `Chapter ${chapterNumber}: ${chapterTitle} - ${novelTitle}`
  const description = `Read ${novelTitle} Chapter ${chapterNumber}: ${chapterTitle} by ${authorName} online for free on ButterNovel.`

  return {
    title: fullTitle,
    description,

    keywords: [
      novelTitle,
      chapterTitle,
      authorName,
      'chapter',
      'read online',
      'free chapter',
    ],

    authors: [{ name: authorName }],

    openGraph: {
      type: 'article',
      url: pageUrl,
      title: fullTitle,
      description,
      siteName: 'ButterNovel',
      locale: 'en_US',
    },

    twitter: {
      card: 'summary',
      title: fullTitle,
      description,
      creator: '@butternovel',
    },

    alternates: {
      canonical: pageUrl,
    },

    robots: {
      index: true,
      follow: true,
    },
  }
}

interface CategoryMetadataParams {
  categoryName: string
  categorySlug: string
  novelCount?: number
}

/**
 * 生成分类页元数据
 */
export function generateCategoryMetadata({
  categoryName,
  categorySlug,
  novelCount,
}: CategoryMetadataParams): Metadata {
  const pageUrl = `${baseUrl}/category/${categorySlug}`
  const description = novelCount
    ? `Discover ${novelCount}+ ${categoryName} novels on ButterNovel. Read free ${categoryName} web novels online.`
    : `Discover the best ${categoryName} novels on ButterNovel. Read free ${categoryName} web novels online.`

  return {
    title: `${categoryName} Novels`,
    description,

    keywords: [
      `${categoryName} novels`,
      `free ${categoryName} novels`,
      `${categoryName} web novels`,
      'read online',
      'butternovel',
    ],

    openGraph: {
      type: 'website',
      url: pageUrl,
      title: `${categoryName} Novels | ButterNovel`,
      description,
      siteName: 'ButterNovel',
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${categoryName} Novels`,
        },
      ],
      locale: 'en_US',
    },

    twitter: {
      card: 'summary_large_image',
      title: `${categoryName} Novels | ButterNovel`,
      description,
      creator: '@butternovel',
    },

    alternates: {
      canonical: pageUrl,
    },
  }
}

/**
 * 生成搜索页元数据
 */
export function generateSearchMetadata(query?: string): Metadata {
  const pageUrl = `${baseUrl}/search${query ? `?q=${encodeURIComponent(query)}` : ''}`
  const title = query ? `Search results for "${query}"` : 'Search Novels'
  const description = query
    ? `Search results for "${query}" on ButterNovel. Find your favorite novels.`
    : 'Search millions of free novels on ButterNovel. Find your next favorite story.'

  return {
    title,
    description,

    openGraph: {
      type: 'website',
      url: pageUrl,
      title: `${title} | ButterNovel`,
      description,
      siteName: 'ButterNovel',
      locale: 'en_US',
    },

    twitter: {
      card: 'summary',
      title: `${title} | ButterNovel`,
      description,
      creator: '@butternovel',
    },

    robots: {
      index: query ? false : true, // 不索引搜索结果页
      follow: true,
    },
  }
}

/**
 * 生成结构化数据（JSON-LD）
 */
export function generateNovelJsonLd({
  title,
  blurb,
  coverImage,
  authorName,
  slug,
  averageRating,
  totalRatings,
  createdAt,
  updatedAt,
}: NovelMetadataParams & {
  averageRating?: number | null
  totalRatings?: number
  createdAt: Date
  updatedAt: Date
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: title,
    description: blurb,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    image: coverImage || `${baseUrl}/og-image.png`,
    url: `${baseUrl}/novels/${slug}`,
    datePublished: createdAt.toISOString(),
    dateModified: updatedAt.toISOString(),
    publisher: {
      '@type': 'Organization',
      name: 'ButterNovel',
      url: baseUrl,
    },
    ...(averageRating &&
      totalRatings && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: averageRating,
          reviewCount: totalRatings,
          bestRating: 10,
          worstRating: 0,
        },
      }),
  }

  return jsonLd
}
