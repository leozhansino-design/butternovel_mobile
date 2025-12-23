// src/components/seo/BreadcrumbJsonLd.tsx
// SEO: BreadcrumbList structured data for better search appearance
// Helps Google understand page hierarchy and shows breadcrumbs in search results

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[]
}

export default function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const baseUrl = 'https://butternovel.com'

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  )
}

// Pre-built breadcrumb configurations for common pages
export function getNovelBreadcrumbs(categoryName: string, categorySlug: string, novelTitle: string, novelSlug: string): BreadcrumbItem[] {
  return [
    { name: 'Home', url: '/' },
    { name: categoryName, url: `/search?category=${categorySlug}` },
    { name: novelTitle, url: `/novels/${novelSlug}` },
  ]
}

export function getChapterBreadcrumbs(
  categoryName: string,
  categorySlug: string,
  novelTitle: string,
  novelSlug: string,
  chapterNumber: number,
  chapterTitle: string
): BreadcrumbItem[] {
  return [
    { name: 'Home', url: '/' },
    { name: categoryName, url: `/search?category=${categorySlug}` },
    { name: novelTitle, url: `/novels/${novelSlug}` },
    { name: `Chapter ${chapterNumber}: ${chapterTitle}`, url: `/novels/${novelSlug}/chapters/${chapterNumber}` },
  ]
}

export function getCategoryBreadcrumbs(categoryName: string, categorySlug: string): BreadcrumbItem[] {
  return [
    { name: 'Home', url: '/' },
    { name: 'Categories', url: '/search' },
    { name: categoryName, url: `/search?category=${categorySlug}` },
  ]
}

export function getTagBreadcrumbs(tagName: string, tagSlug: string): BreadcrumbItem[] {
  return [
    { name: 'Home', url: '/' },
    { name: 'Tags', url: '/search' },
    { name: tagName, url: `/tags/${tagSlug}` },
  ]
}

export function getAuthorBreadcrumbs(authorName: string, authorId: string): BreadcrumbItem[] {
  return [
    { name: 'Home', url: '/' },
    { name: 'Authors', url: '/search' },
    { name: authorName, url: `/authors/${authorId}` },
  ]
}
