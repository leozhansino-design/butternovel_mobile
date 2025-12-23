// src/app/sitemap.ts
// Generate sitemap dynamically for Google & AI search engines
// SEO optimized sitemap with novels, shorts, chapters, categories, and tags
import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

// Types for sitemap data
interface NovelSitemapData {
  slug: string
  title: string
  updatedAt: Date
  viewCount: number
  isShortNovel: boolean
  _count: { chapters: number }
}

interface ShortNovelSitemapData {
  slug: string
  updatedAt: Date
  viewCount: number
  shortNovelGenre: string | null
}

interface CategorySitemapData {
  slug: string
  name: string
}

interface TagSitemapData {
  slug: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'

  // Static pages - always available
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/novels`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shorts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/writer`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  try {
    // Fetch all published regular novels (not short novels)
    const novels = await prisma.novel.findMany({
      where: {
        isPublished: true,
        isBanned: false,
        isShortNovel: false,
      },
      select: {
        slug: true,
        title: true,
        updatedAt: true,
        viewCount: true,
        isShortNovel: true,
        _count: {
          select: { chapters: true }
        }
      },
      orderBy: {
        viewCount: 'desc', // Most popular first - these are most important for SEO
      },
      take: 10000,
    })

    // Fetch all published short novels
    const shortNovels = await prisma.novel.findMany({
      where: {
        isPublished: true,
        isBanned: false,
        isShortNovel: true,
      },
      select: {
        slug: true,
        updatedAt: true,
        viewCount: true,
        shortNovelGenre: true,
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: 5000,
    })

    // Novel pages - higher priority for popular novels
    const novelPages: MetadataRoute.Sitemap = novels.map((novel: NovelSitemapData, index: number) => ({
      url: `${baseUrl}/novels/${novel.slug}`,
      lastModified: novel.updatedAt,
      changeFrequency: 'weekly' as const,
      // Top 100 novels get higher priority
      priority: index < 100 ? 0.9 : index < 500 ? 0.8 : 0.7,
    }))

    // First chapter pages for popular novels (helps Google index the content)
    // Only for top 500 novels to keep sitemap size manageable
    const chapterPages: MetadataRoute.Sitemap = novels
      .slice(0, 500)
      .filter((novel: NovelSitemapData) => novel._count.chapters > 0)
      .map((novel: NovelSitemapData) => ({
        url: `${baseUrl}/novels/${novel.slug}/chapters/1`,
        lastModified: novel.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))

    // Fetch all categories
    const categories = await prisma.category.findMany({
      select: {
        slug: true,
        name: true,
      },
    })

    // Category pages with proper URLs
    const categoryPages: MetadataRoute.Sitemap = categories.flatMap((category: CategorySitemapData) => [
      {
        url: `${baseUrl}/category/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/search?category=${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      },
    ])

    // Fetch popular tags (top 200 for better coverage)
    const tags = await prisma.tag.findMany({
      select: {
        slug: true,
      },
      orderBy: {
        count: 'desc',
      },
      take: 200,
    })

    const tagPages: MetadataRoute.Sitemap = tags.map((tag: TagSitemapData, index: number) => ({
      url: `${baseUrl}/tags/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      // Top tags get higher priority
      priority: index < 50 ? 0.7 : 0.6,
    }))

    // Short novel pages - important for AI search traffic (complete stories)
    const shortNovelPages: MetadataRoute.Sitemap = shortNovels.map((novel: ShortNovelSitemapData, index: number) => ({
      url: `${baseUrl}/shorts/${novel.slug}`,
      lastModified: novel.updatedAt,
      changeFrequency: 'weekly' as const,
      // Short novels are high-quality complete content - higher priority
      priority: index < 50 ? 0.85 : index < 200 ? 0.8 : 0.75,
    }))

    // Short novel genre filter pages for SEO
    const shortGenres = ['fantasy', 'romance', 'thriller', 'horror', 'sci-fi', 'mystery',
                         'drama', 'comedy', 'historical', 'urban', 'wuxia', 'xuanhuan',
                         'slice-of-life', 'adventure', 'paranormal', 'inspirational']
    const shortGenrePages: MetadataRoute.Sitemap = shortGenres.map(genre => ({
      url: `${baseUrl}/shorts?genre=${genre}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...novelPages, ...chapterPages, ...categoryPages, ...tagPages, ...shortNovelPages, ...shortGenrePages]
  } catch (error) {
    // If database is not available during build, return static pages only
    console.warn('Sitemap: Database not available, returning static pages only')
    return staticPages
  }
}
