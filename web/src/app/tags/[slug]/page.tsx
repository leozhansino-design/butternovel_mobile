import { Metadata } from 'next'
import Footer from '@/components/shared/Footer'
import TagPageClient from './TagPageClient'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  // Fetch tag info for metadata
  const tag = await prisma.tag.findFirst({
    where: { slug },
    select: {
      name: true,
      slug: true,
      _count: {
        select: {
          novels: {
            where: {
              isPublished: true,
              isBanned: false
            }
          }
        }
      }
    }
  })

  if (!tag) {
    return {
      title: 'Tag Not Found | ButterNovel',
      description: 'The requested tag could not be found.',
    }
  }

  const novelCount = tag._count.novels
  const tagName = tag.name.charAt(0).toUpperCase() + tag.name.slice(1)

  return {
    title: `${tagName} Stories - Free Novels | ButterNovel`,
    description: `Discover ${novelCount.toLocaleString()} free ${tag.name} novels and stories on ButterNovel. Read the best ${tag.name} fiction online for free.`,
    keywords: [
      tag.name,
      `${tag.name} novels`,
      `${tag.name} stories`,
      `${tag.name} fiction`,
      'free novels',
      'read online',
      'web novels'
    ],
    openGraph: {
      title: `${tagName} Stories | ButterNovel`,
      description: `Read ${novelCount.toLocaleString()} free ${tag.name} novels on ButterNovel`,
      type: 'website',
      url: `https://butternovel.com/tags/${slug}`,
      siteName: 'ButterNovel',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tagName} Stories | ButterNovel`,
      description: `Read ${novelCount.toLocaleString()} free ${tag.name} novels`,
    },
    alternates: {
      canonical: `https://butternovel.com/tags/${slug}`,
    },
  }
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params

  // Fetch tag data for JSON-LD
  const tag = await prisma.tag.findFirst({
    where: { slug },
    select: {
      name: true,
      slug: true,
      _count: {
        select: {
          novels: {
            where: {
              isPublished: true,
              isBanned: false
            }
          }
        }
      }
    }
  })

  // JSON-LD structured data for SEO
  const jsonLd = tag ? {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${tag.name} Stories`,
    description: `Collection of ${tag._count.novels} free ${tag.name} novels and stories`,
    url: `https://butternovel.com/tags/${slug}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://butternovel.com'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Tags',
          item: 'https://butternovel.com/search'
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: tag.name,
          item: `https://butternovel.com/tags/${slug}`
        }
      ]
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: tag._count.novels,
      itemListElement: []
    }
  } : null

  return (
    <>
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-1">
          <TagPageClient slug={slug} />
        </main>
        <Footer />
      </div>
    </>
  )
}
