// src/app/novels/[slug]/page.tsx
// ⚡ 性能优化：减少数据库查询 + 延迟加载章节内容 + ISR缓存
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/shared/Footer'
import ViewTracker from '@/components/ViewTracker'
import ReadingHistoryTracker from '@/components/ReadingHistoryTracker'
import { formatNumber } from '@/lib/format'
import ClientAddToLibraryButton from '@/components/novel/ClientAddToLibraryButton'
import ChapterPreview from '@/components/novel/ChapterPreview'
import TableOfContents from '@/components/novel/TableOfContents'
import { getCloudinaryBlurUrl } from '@/lib/image-utils'
import ClientRatingDisplay from '@/components/novel/ClientRatingDisplay'
import FollowAuthorButton from '@/components/novel/FollowAuthorButton'
import AuthorNameButton from '@/components/novel/AuthorNameButton'
import { getContentRatingLabel, getRightsTypeLabel, getContentRatingColor } from '@/lib/content-rating'
import ScrollToTop from '@/components/ScrollToTop'
import MobileExpandableSection from '@/components/novel/MobileExpandableSection'
import BreadcrumbJsonLd, { getNovelBreadcrumbs } from '@/components/seo/BreadcrumbJsonLd'
import FAQJsonLd, { getNovelFAQs } from '@/components/seo/FAQJsonLd'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// SEO: Generate metadata for each novel page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  const novel = await prisma.novel.findUnique({
    where: { slug },
    select: {
      title: true,
      slug: true,
      blurb: true,
      coverImage: true,
      authorName: true,
      status: true,
      averageRating: true,
      totalRatings: true,
      viewCount: true,
      isPublished: true,
      isBanned: true,
      category: {
        select: { name: true, slug: true }
      },
      tags: {
        select: { name: true },
        take: 5
      },
      _count: {
        select: { chapters: true }
      }
    }
  })

  if (!novel || !novel.isPublished || novel.isBanned) {
    return {
      title: 'Novel Not Found | ButterNovel',
      description: 'This novel is not available.',
    }
  }

  const chapterCount = novel._count.chapters
  const rating = novel.averageRating ? `${novel.averageRating.toFixed(1)}/10` : 'Not rated'
  const tagNames = novel.tags.map((t: { name: string }) => t.name).join(', ')

  // Truncate blurb for description (150-160 chars is optimal for Google)
  const description = novel.blurb.length > 155
    ? novel.blurb.substring(0, 152) + '...'
    : novel.blurb

  // SEO optimized title - include key search terms
  const seoTitle = `${novel.title} - Read Free Online | ${novel.category.name} Novel by ${novel.authorName}`

  // Enhanced description with more context
  const seoDescription = `Read "${novel.title}" by ${novel.authorName} for free on ButterNovel. ${chapterCount} chapters available. Rating: ${rating}. ${description}`

  return {
    title: seoTitle,
    description: seoDescription.slice(0, 160),
    keywords: [
      // Book title variations (MOST IMPORTANT for searching by book name)
      novel.title,
      `${novel.title} novel`,
      `${novel.title} free`,
      `${novel.title} online`,
      `read ${novel.title}`,
      `${novel.title} read online`,
      `${novel.title} free online`,
      `${novel.title} ${novel.authorName}`,
      // Author name variations
      novel.authorName,
      `${novel.authorName} novels`,
      `${novel.authorName} books`,
      // Category & genre
      novel.category.name,
      `${novel.category.name} novel`,
      `${novel.category.name} novels`,
      `free ${novel.category.name} novel`,
      // Tags
      ...novel.tags.map((t: { name: string }) => t.name),
      ...novel.tags.map((t: { name: string }) => `${t.name} novel`),
      // General keywords
      'free novel',
      'read online free',
      'web novel',
      'online novel',
      'butternovel',
      'butter novel',
    ],
    authors: [{ name: novel.authorName }],
    openGraph: {
      type: 'book',
      title: `${novel.title} by ${novel.authorName} - Free on ButterNovel`,
      description: description,
      url: `https://butternovel.com/novels/${slug}`,
      siteName: 'ButterNovel',
      images: [
        {
          url: novel.coverImage,
          width: 800,
          height: 1200,
          alt: `${novel.title} - ${novel.category.name} Novel Cover`,
        },
      ],
      authors: [novel.authorName],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${novel.title} by ${novel.authorName} - Free`,
      description: `Read ${novel.title} free online. ${chapterCount} chapters. ${novel.category.name}.`,
      images: [novel.coverImage],
    },
    alternates: {
      canonical: `https://butternovel.com/novels/${slug}`,
    },
    // Ensure Google indexes this page
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  }
}

async function getNovel(slug: string) {
  console.log(`[Novel] 📖 Fetching novel: ${slug}`)
  const startTime = Date.now()

  // 🔧 OPTIMIZATION: Removed Redis caching for novel detail pages
  // Reason: ISR already caches the rendered HTML for 1 hour
  // - Most novels have low traffic - ISR HTML cache sufficient for hot novels
  // - Novel details rarely change (no need for dual caching)
  // - Eliminates ~960 Redis calls/day for 20 popular novels

  const novel = await withRetry(
    () => prisma.novel.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        blurb: true,
        authorId: true,  // ⭐ Added for follow functionality
        authorName: true,
        status: true,
        contentRating: true,
        rightsType: true,
        isPublished: true,
        isBanned: true,
        viewCount: true,
        likeCount: true,
        wordCount: true,
        averageRating: true,
        totalRatings: true,
        createdAt: true,
        category: true,
        tags: {
          select: {
            id: true,
            name: true,
            slug: true
          },
          orderBy: {
            name: 'asc'
          }
        },
        chapters: {
          where: { isPublished: true },
          orderBy: { chapterNumber: 'asc' },
          // ⚡ 获取所有章节元数据（用于目录显示）
          select: {
            id: true,
            title: true,
            chapterNumber: true,
            wordCount: true,
            createdAt: true,
            // ⚡ content 移除，由 ChapterPreview 组件单独加载
          },
        },
        _count: {
          select: {
            chapters: true,
            likes: true,
          },
        },
      },
    }),
    { operationName: 'Get novel details' }
  ) as any

  if (!novel || !novel.isPublished || novel.isBanned) {
    console.log(`[Novel] ❌ Novel not found or not available: ${slug}`)
    return null
  }

  const duration = Date.now() - startTime
  console.log(`[Novel] ✅ Loaded "${novel.title}": ${novel.chapters?.length || 0} chapters (${duration}ms)`)

  return novel
}

async function getAuthorAvatar(authorId: string): Promise<string | null> {
  try {
    const author = await withRetry(
      () => prisma.user.findUnique({
        where: { id: authorId },
        select: {
          avatar: true,
        },
      }),
      { operationName: 'Get author avatar' }
    ) as { avatar: string | null } | null
    return author?.avatar || null
  } catch (error) {
    console.error('[Novel] Failed to fetch author avatar:', error)
    return null
  }
}

// ✅ ISR: 1小时重新验证
// Next.js 会缓存渲染后的页面，只在 revalidate 时间后重新获取数据
// 这样可以避免每次请求都访问 Redis，大幅减少 Redis commands
export const revalidate = 3600

// 🔧 CRITICAL FIX: Override Upstash's default no-store fetch behavior
// Without this, Upstash Redis's no-store fetch causes "dynamic server usage" errors
export const fetchCache = 'force-cache'

/**
 * ⚡ CRITICAL FIX: Removed server-side auth() call
 *
 * Previously: Called auth() on server → forced dynamic rendering
 * Now: Client components use useSession() → page can be statically cached
 *
 * Result: ISR works properly with revalidate = 3600 (1 hour)
 */
export default async function NovelDetailPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const novel = await getNovel(slug)

  if (!novel) {
    notFound()
  }

  // Get author avatar separately
  const authorAvatar = await getAuthorAvatar(novel.authorId)

  const firstChapter = novel.chapters[0]
  const allChapters = novel.chapters

  // JSON-LD structured data for SEO (Google Rich Snippets)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': `https://butternovel.com/novels/${novel.slug}`,
    name: novel.title,
    alternateName: [
      `${novel.title} novel`,
      `${novel.title} free`,
      `Read ${novel.title}`,
    ],
    author: {
      '@type': 'Person',
      name: novel.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ButterNovel',
      alternateName: ['Butter Novel', 'butternovel.com'],
      url: 'https://butternovel.com',
    },
    genre: novel.category.name,
    keywords: novel.tags.map((t: { name: string }) => t.name).join(', '),
    description: novel.blurb,
    image: novel.coverImage,
    url: `https://butternovel.com/novels/${novel.slug}`,
    inLanguage: 'en',
    ...(novel.averageRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: novel.averageRating,
        ratingCount: novel.totalRatings,
        bestRating: 10,
        worstRating: 1,
      },
    }),
    numberOfPages: novel.chapters.length,
    bookFormat: 'EBook',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  }

  // SEO: Breadcrumb data
  const breadcrumbItems = getNovelBreadcrumbs(
    novel.category.name,
    novel.category.slug,
    novel.title,
    novel.slug
  )

  // SEO: FAQ data for this novel
  const novelFaqs = getNovelFAQs(novel.title, novel.authorName, novel.chapters.length)

  return (
    <>
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* SEO: Breadcrumb structured data */}
      <BreadcrumbJsonLd items={breadcrumbItems} />

      {/* SEO: FAQ structured data for novel */}
      <FAQJsonLd faqs={novelFaqs} />

      <ViewTracker novelId={novel.id} />
      <ReadingHistoryTracker novelId={novel.id} />
      <ScrollToTop />

      {/* 预加载第一章完整内容 */}
      {firstChapter && (
        <link
          rel="prefetch"
          href={`/novels/${novel.slug}/chapters/${firstChapter.chapterNumber}`}
          as="document"
        />
      )}

      {/* 蓝天到白色的整体渐变背景 */}
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-100/60 via-blue-50/30 via-white to-white">
        <main className="flex-1">
          {/* 小说详情区域 - 移动端竖屏优化 */}
          <section className="relative py-4 sm:py-8 md:py-12 lg:py-20">

            <div className="container mx-auto px-3 sm:px-4 relative">
              <div className="max-w-7xl mx-auto">
                <div className="glass-effect-strong rounded-2xl sm:rounded-3xl card-shadow-xl overflow-hidden">
                  {/* 移动端竖屏：水平布局（封面+信息并排）; 大屏：原有双列布局 */}
                  <div className="p-4 sm:p-6 md:p-8 lg:p-12">

                    {/* 移动端竖屏布局：封面和基本信息水平排列 */}
                    <div className="flex gap-4 sm:hidden">
                      {/* 左侧：紧凑封面 */}
                      <div className="flex-shrink-0">
                        <div className="relative group">
                          <div className="relative w-[100px] h-[140px] rounded-lg overflow-hidden shadow-lg border border-white/80 bg-white">
                            <Image
                              src={novel.coverImage}
                              alt={novel.title}
                              fill
                              className="object-cover"
                              priority
                              placeholder="blur"
                              blurDataURL={getCloudinaryBlurUrl(novel.coverImage)}
                              sizes="100px"
                            />
                          </div>
                        </div>
                        {/* 移动端评分 - 紧凑显示 */}
                        <div className="mt-2 w-[100px]">
                          <ClientRatingDisplay
                            novelId={novel.id}
                            averageRating={novel.averageRating ?? 0}
                            totalRatings={novel.totalRatings}
                            compact={true}
                          />
                        </div>
                      </div>

                      {/* 右侧：标题、作者、统计 */}
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <h1 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2">
                          {novel.title}
                        </h1>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">by</span>
                          {authorAvatar && (
                            <Image
                              src={authorAvatar}
                              alt={novel.authorName}
                              width={20}
                              height={20}
                              className="rounded-full border border-blue-100"
                            />
                          )}
                          <AuthorNameButton authorId={novel.authorId} authorName={novel.authorName} />
                        </div>

                        {/* 移动端统计 - 紧凑单行 */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="font-medium">{formatNumber(novel.viewCount)}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="font-medium">{novel._count.chapters} ch</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">{Math.ceil(novel.wordCount / 800)}m</span>
                          </span>
                        </div>

                        {/* 移动端分类和状态 */}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <Link href={`/search?category=${novel.category.slug}`}>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              {novel.category.name}
                            </span>
                          </Link>
                          <Link href={`/search?status=${novel.status}`}>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              novel.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-blue-50/70 text-blue-600'
                            }`}>
                              {novel.status === 'COMPLETED' ? 'Completed' : 'Ongoing'}
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* 移动端：标签和简介（可展开/收起） */}
                    <div className="sm:hidden">
                      <MobileExpandableSection
                        blurb={novel.blurb}
                        tags={novel.tags || []}
                      />
                    </div>

                    {/* 移动端：操作按钮 */}
                    <div className="sm:hidden mt-4 flex gap-2">
                      <Link
                        href={`/novels/${novel.slug}/chapters/1`}
                        className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 text-white font-semibold rounded-lg shadow-md text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Start Reading
                      </Link>
                      <ClientAddToLibraryButton novelId={novel.id} compact={true} />
                    </div>

                    {/* 移动端：内容评级 */}
                    <div className="sm:hidden mt-3 text-xs text-gray-500 text-center border-t border-gray-100 pt-3">
                      <span>{getContentRatingLabel(novel.contentRating)}</span>
                      <span className="mx-2">·</span>
                      <span>{getRightsTypeLabel(novel.rightsType)}</span>
                    </div>

                    {/* 平板和桌面端：原有双列布局 */}
                    <div className="hidden sm:grid lg:grid-cols-[320px_1fr] gap-6 lg:gap-8">
                      <div className="flex flex-col items-center lg:items-start">
                        <div className="relative group book-shadow-3d">
                          {/* 封面光效 - Logo 蓝色 */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.08] to-blue-500/[0.05] rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 z-0"></div>
                          <div className="relative w-[200px] sm:w-[240px] lg:w-[280px] h-[280px] sm:h-[340px] lg:h-[400px] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/80 bg-white z-10">
                            <Image
                              src={novel.coverImage}
                              alt={novel.title}
                              fill
                              className="object-cover"
                              priority
                              placeholder="blur"
                              blurDataURL={getCloudinaryBlurUrl(novel.coverImage)}
                              sizes="(max-width: 640px) 200px, (max-width: 1024px) 240px, 280px"
                            />
                          </div>
                        </div>

                        {/* Rating Display */}
                        <div className="w-[200px] sm:w-[240px] lg:w-[280px] mt-4">
                          <ClientRatingDisplay
                            novelId={novel.id}
                            averageRating={novel.averageRating ?? 0}
                            totalRatings={novel.totalRatings}
                          />
                        </div>

                        {/* Content Rating & Rights */}
                        <div className="w-[200px] sm:w-[240px] lg:w-[280px] mt-3 text-xs text-gray-600 text-center">
                          <div>{getContentRatingLabel(novel.contentRating)}</div>
                          <div>{getRightsTypeLabel(novel.rightsType)}</div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-5 lg:gap-7">

                        <div className="space-y-3 lg:space-y-4">
                          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
                            {novel.title}
                          </h1>
                          <div className="flex items-center gap-3 text-sm lg:text-base">
                            <span className="text-gray-500 font-medium">by</span>
                            {authorAvatar && (
                              <Image
                                src={authorAvatar}
                                alt={novel.authorName}
                                width={32}
                                height={32}
                                className="rounded-full border-2 border-blue-100"
                              />
                            )}
                            <AuthorNameButton authorId={novel.authorId} authorName={novel.authorName} />
                            <FollowAuthorButton authorId={novel.authorId} authorName={novel.authorName} />
                          </div>
                        </div>

                        {/* Category, Status, and Tags Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/search?category=${novel.category.slug}`}>
                            <span className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-r from-blue-50 to-blue-50/80 text-blue-700 rounded-lg font-semibold text-xs lg:text-sm border border-blue-200/60 shadow-sm hover:bg-blue-100 transition-colors cursor-pointer">
                              {novel.category.name}
                            </span>
                          </Link>
                          <Link href={`/search?status=${novel.status}`}>
                            <span className={`px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg font-semibold text-xs lg:text-sm shadow-sm cursor-pointer transition-colors ${
                              novel.status === 'COMPLETED'
                                ? 'bg-gradient-to-r from-emerald-50 to-emerald-50/80 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100'
                                : 'bg-gradient-to-r from-blue-50/70 to-blue-50/50 text-blue-600 border border-blue-200/50 hover:bg-blue-100'
                            }`}>
                              {novel.status === 'COMPLETED' ? 'Completed' : 'Ongoing'}
                            </span>
                          </Link>
                          {novel.tags && novel.tags.length > 0 && (
                            <>
                              {novel.tags.map((tag: { id: number; name: string; slug: string }) => (
                                <Link key={tag.slug} href={`/search?tags=${tag.slug}`}>
                                  <span className="px-2.5 py-1 lg:px-3 bg-indigo-100 text-indigo-700 rounded-full text-xs lg:text-sm font-medium hover:bg-indigo-200 transition-colors cursor-pointer">
                                    {tag.name}
                                  </span>
                                </Link>
                              ))}
                            </>
                          )}
                        </div>

                        {/* Stats - Single Row */}
                        <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-gray-600 text-sm lg:text-base">
                          <div className="flex items-center gap-1.5 lg:gap-2">
                            <svg className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="font-semibold text-gray-900">{formatNumber(novel.viewCount)}</span>
                            <span className="text-xs lg:text-sm">Reads</span>
                          </div>

                          <div className="flex items-center gap-1.5 lg:gap-2">
                            <svg className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="font-semibold text-gray-900">{novel._count.chapters}</span>
                            <span className="text-xs lg:text-sm">Chapters</span>
                          </div>

                          <div className="flex items-center gap-1.5 lg:gap-2">
                            <svg className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-semibold text-gray-900">{Math.ceil(novel.wordCount / 800)}m</span>
                            <span className="text-xs lg:text-sm">Read</span>
                          </div>
                        </div>

                        {/* Blurb Section */}
                        <div className="flex-1 min-h-0 space-y-2 lg:space-y-3">
                          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Blurb
                          </h2>
                          <div className="prose prose-gray max-w-none">
                            <p className="text-gray-700 text-sm lg:text-[15px] leading-relaxed whitespace-pre-wrap max-h-[150px] lg:max-h-[200px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-blue-400/30 scrollbar-track-transparent hover:scrollbar-thumb-blue-500/40 transition-colors">
                              {novel.blurb}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-4 border-t border-gray-100">
                          <Link
                            href={`/novels/${novel.slug}/chapters/1`}
                            className="btn-primary flex items-center gap-2 px-6 py-3 lg:px-8 lg:py-4 text-white font-semibold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg text-sm lg:text-base"
                          >
                            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Start Reading
                          </Link>

                          {/* ⭐ Client-side library button - fetches session independently */}
                          <ClientAddToLibraryButton
                            novelId={novel.id}
                          />
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ⚡ 第一章预览 - 只显示 200-300 字 + 渐变效果 */}
          {firstChapter && (
            <Suspense
              fallback={
                <section className="py-12">
                  <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto space-y-8">
                      <div className="mb-8">
                        <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                      </div>
                      <div className="space-y-3">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className="h-5 bg-gray-100 rounded animate-pulse"
                            style={{
                              width: i % 4 === 3 ? '85%' : '100%',
                              animationDelay: `${i * 50}ms`
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              }
            >
              <ChapterPreview
                chapterId={firstChapter.id}
                chapterNumber={firstChapter.chapterNumber}
                chapterTitle={firstChapter.title}
                novelSlug={novel.slug}
              />
            </Suspense>
          )}

          {/* ⚡ 章节目录 - Table of Contents */}
          {allChapters.length > 0 && (
            <TableOfContents
              chapters={allChapters}
              novelSlug={novel.slug}
            />
          )}
        </main>

        <Footer />
      </div>
    </>
  )
}