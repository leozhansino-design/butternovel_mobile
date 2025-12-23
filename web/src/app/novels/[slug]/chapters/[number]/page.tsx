// src/app/novels/[slug]/chapters/[number]/page.tsx
// ✅ 修复：统一缓存策略
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import ChapterReader from '@/components/reader/ChapterReader'
import ViewTracker from '@/components/ViewTracker'
import BreadcrumbJsonLd, { getChapterBreadcrumbs } from '@/components/seo/BreadcrumbJsonLd'

interface PageProps {
  params: Promise<{
    slug: string
    number: string
  }>
}

// SEO: Generate metadata for each chapter
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, number } = await params
  const chapterNumber = parseInt(number)

  if (isNaN(chapterNumber)) {
    return {
      title: 'Chapter Not Found | ButterNovel',
      description: 'The requested chapter could not be found.',
    }
  }

  try {
    const [novel, chapter, totalChapters] = await Promise.all([
      prisma.novel.findUnique({
        where: { slug },
        select: {
          title: true,
          slug: true,
          authorName: true,
          blurb: true,
          category: { select: { name: true, slug: true } },
        }
      }),
      prisma.chapter.findFirst({
        where: {
          novel: { slug },
          chapterNumber,
          isPublished: true
        },
        select: {
          title: true,
          chapterNumber: true,
          wordCount: true,
          content: true,
        }
      }),
      prisma.chapter.count({
        where: {
          novel: { slug },
          isPublished: true
        }
      })
    ])

    if (!novel || !chapter) {
      return {
        title: 'Chapter Not Found | ButterNovel',
        description: 'The requested chapter could not be found.',
      }
    }

    // Extract first 150 chars of chapter content for description
    const plainText = chapter.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    const description = plainText.length > 150
      ? plainText.substring(0, 147) + '...'
      : plainText

    return {
      title: `${novel.title} - Chapter ${chapterNumber}: ${chapter.title}`,
      description: description,
      keywords: [
        novel.title,
        `chapter ${chapterNumber}`,
        chapter.title,
        novel.authorName,
        novel.category.name,
        'free chapter',
        'read online'
      ],
      authors: [{ name: novel.authorName }],
      openGraph: {
        type: 'article',
        title: `${novel.title} - Chapter ${chapterNumber}`,
        description: description,
        url: `https://butternovel.com/novels/${slug}/chapters/${chapterNumber}`,
        siteName: 'ButterNovel',
        authors: [novel.authorName],
      },
      twitter: {
        card: 'summary',
        title: `${novel.title} - Ch.${chapterNumber}`,
        description: description,
      },
      alternates: {
        canonical: `https://butternovel.com/novels/${slug}/chapters/${chapterNumber}`,
      },
      // SEO: Chapter navigation hints for search engines
      other: {
        ...(chapterNumber > 1 && {
          'prev': `https://butternovel.com/novels/${slug}/chapters/${chapterNumber - 1}`,
        }),
        ...(chapterNumber < totalChapters && {
          'next': `https://butternovel.com/novels/${slug}/chapters/${chapterNumber + 1}`,
        }),
      },
    }
  } catch (error) {
    return {
      title: 'Chapter Not Found | ButterNovel',
      description: 'The requested chapter could not be found.',
    }
  }
}

async function getChapterData(slug: string, chapterNumber: number) {
  // 🔄 添加数据库重试机制，解决连接超时问题
  try {
    const [novel, chapter, chapters, nextChapterContent] = (await Promise.all([
      withRetry(
        () => prisma.novel.findUnique({
          where: { slug },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            category: { select: { name: true, slug: true } },
            _count: {
              select: { chapters: true }
            }
          }
        }),
        { operationName: 'Get novel for chapter page' }
      ),

      withRetry(
        () => prisma.chapter.findFirst({
          where: {
            novel: { slug },
            chapterNumber: chapterNumber,
            isPublished: true
          },
          select: {
            id: true,
            title: true,
            chapterNumber: true,
            content: true,
            wordCount: true,
            novelId: true,
          }
        }),
        { operationName: 'Get current chapter' }
      ),

      // ✅ 优化: 只加载当前章节附近的章节 (窗口分页,防止大型小说崩溃)
      withRetry(
        () => prisma.chapter.findMany({
          where: {
            novel: { slug },
            isPublished: true,
            chapterNumber: {
              gte: Math.max(1, chapterNumber - 10),
              lte: chapterNumber + 10
            }
          },
          select: {
            id: true,
            chapterNumber: true,
            title: true
          },
          orderBy: {
            chapterNumber: 'asc'
          }
        }),
        { operationName: 'Get nearby chapters list' }
      ),

      withRetry(
        () => prisma.chapter.findFirst({
          where: {
            novel: { slug },
            chapterNumber: chapterNumber + 1,
            isPublished: true
          },
          select: {
            content: true,
          }
        }),
        { operationName: 'Get next chapter for prefetch' }
      )
    ])) as [any, any, any[], any]

    if (!novel || !chapter) return null

    return {
      novel,
      chapter,
      chapters,
      nextChapterContent,
      totalChapters: novel._count.chapters
    }
  } catch (error: unknown) {
    // 🔧 FIX: Better error logging for Server Component errors
    console.error('[Chapter Page] Error fetching chapter data:', {
      slug,
      chapterNumber,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    // Check for specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string }
      if (dbError.code === 'P1001') {
        console.error('[Chapter Page] Database connection failed - max connections may be reached')
      } else if (dbError.code === 'P1008') {
        console.error('[Chapter Page] Database operation timed out')
      }
    }

    // Re-throw to let Next.js handle it
    throw error
  }
}

// ✅ 性能优化：使用 ISR 缓存章节页面
// 章节内容很少变化，可以缓存 1 小时
// 之前的 force-dynamic 导致每次请求都查询数据库，现在改为 ISR
export const revalidate = 3600 // 缓存 1 小时

// 🔧 修复 build 连接池超时：允许动态参数，不强制预渲染所有章节
export const dynamicParams = true

export default async function ChapterPage({ params }: PageProps) {
  const resolvedParams = await params
  const chapterNumber = parseInt(resolvedParams.number)

  if (isNaN(chapterNumber)) {
    notFound()
  }

  const data = await getChapterData(resolvedParams.slug, chapterNumber)

  if (!data) {
    notFound()
  }

  // SEO: Breadcrumb data for chapter page
  const breadcrumbItems = getChapterBreadcrumbs(
    data.novel.category?.name || 'Novel',
    data.novel.category?.slug || 'novel',
    data.novel.title,
    data.novel.slug,
    data.chapter.chapterNumber,
    data.chapter.title
  )

  return (
    <>
      {/* SEO: Breadcrumb structured data */}
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <ViewTracker novelId={data.novel.id} />

      {data.nextChapterContent && (
        <link
          rel="prefetch"
          href={`/novels/${data.novel.slug}/chapters/${chapterNumber + 1}`}
          as="document"
        />
      )}

      <ChapterReader
        novel={data.novel}
        chapter={data.chapter}
        chapters={data.chapters}
        totalChapters={data.totalChapters}
      />
    </>
  )
}

export async function generateStaticParams() {
  // 🔧 修复构建时数据库连接问题：完全跳过预渲染
  // 所有章节页面都通过 dynamicParams = true 在访问时动态生成
  // 这样可以避免构建时的数据库连接超时问题

  // 返回空数组，不预渲染任何章节页面
  return []
}