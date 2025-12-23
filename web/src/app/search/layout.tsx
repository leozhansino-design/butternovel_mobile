// src/app/search/layout.tsx
// SEO metadata for search page
import { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'

export const metadata: Metadata = {
  title: 'Search Novels - Find Free Books by Genre, Author & Tags | ButterNovel',
  description: 'Search thousands of free novels on ButterNovel. Filter by genre (Fantasy, Romance, Sci-Fi, Mystery, Horror), status (Completed/Ongoing), author name, or tags. Find your perfect read!',
  keywords: [
    // Search-specific keywords
    'search novels',
    'find novels',
    'novel search',
    'book search',
    'search free novels',
    'find free books',
    // Genre keywords
    'fantasy novels',
    'romance novels',
    'sci-fi novels',
    'mystery novels',
    'horror novels',
    'adventure novels',
    'werewolf novels',
    'vampire novels',
    // Filter keywords
    'completed novels',
    'ongoing novels',
    'search by author',
    'search by genre',
    'search by tags',
    // Brand
    'butternovel',
    'butter novel',
    'butternovel search',
    'butter novel search',
  ],
  openGraph: {
    title: 'Search Free Novels | ButterNovel',
    description: 'Find your next favorite novel. Search by genre, author, tags, or status. Thousands of free novels available.',
    type: 'website',
    url: `${baseUrl}/search`,
    siteName: 'ButterNovel',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search Novels - ButterNovel',
    description: 'Search thousands of free novels by genre, author, or tags.',
    site: '@butternovel',
  },
  alternates: {
    canonical: `${baseUrl}/search`,
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

// JSON-LD structured data for search page
function SearchPageJsonLd() {
  const searchPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: 'Novel Search - ButterNovel',
    description: 'Search thousands of free novels by genre, author, tags, or status.',
    url: `${baseUrl}/search`,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-US',
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Search Novels',
        item: `${baseUrl}/search`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  )
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SearchPageJsonLd />
      {children}
    </>
  )
}
