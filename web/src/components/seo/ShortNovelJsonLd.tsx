// src/components/seo/ShortNovelJsonLd.tsx
// Structured data for short novel reader page
// Includes: Article, Book, BreadcrumbList, ReadAction schemas

interface ShortNovelJsonLdProps {
  novel: {
    id: number
    title: string
    slug: string
    blurb: string
    shortNovelGenre: string | null
    wordCount: number
    viewCount: number
    authorName: string
    averageRating: number | null
    ratingsCount: number
  }
  readingTime: number
  genreName: string
}

export default function ShortNovelJsonLd({ novel, readingTime, genreName }: ShortNovelJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'
  const novelUrl = `${baseUrl}/shorts/${novel.slug}`

  // Article schema - optimal for short stories/articles
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${novelUrl}#article`,
    headline: novel.title,
    description: novel.blurb.substring(0, 160),
    articleBody: novel.blurb,
    wordCount: novel.wordCount,
    author: {
      '@type': 'Person',
      name: novel.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ButterNovel',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icon-512.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': novelUrl,
    },
    url: novelUrl,
    inLanguage: 'en-US',
    genre: genreName || 'Short Novel',
    isAccessibleForFree: true,
    ...(novel.averageRating && novel.averageRating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: novel.averageRating.toFixed(1),
        bestRating: 5,
        worstRating: 1,
        ratingCount: novel.ratingsCount || 1,
      },
    }),
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ReadAction',
        userInteractionCount: novel.viewCount,
      },
    ],
  }

  // Book/ShortStory schema - for book-specific structured data
  const bookSchema = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': `${novelUrl}#book`,
    name: novel.title,
    description: novel.blurb.substring(0, 300),
    url: novelUrl,
    author: {
      '@type': 'Person',
      name: novel.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ButterNovel',
    },
    bookFormat: 'EBook',
    numberOfPages: Math.ceil(novel.wordCount / 250), // Estimate pages
    genre: genreName || 'Short Novel',
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    ...(novel.averageRating && novel.averageRating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: novel.averageRating.toFixed(1),
        bestRating: 5,
        worstRating: 1,
        ratingCount: novel.ratingsCount || 1,
      },
    }),
    potentialAction: {
      '@type': 'ReadAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: novelUrl,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
          'http://schema.org/IOSPlatform',
          'http://schema.org/AndroidPlatform',
        ],
      },
      expectsAcceptanceOf: {
        '@type': 'Offer',
        price: 0,
        priceCurrency: 'USD',
        eligibleRegion: {
          '@type': 'Place',
          name: 'Worldwide',
        },
        availability: 'https://schema.org/InStock',
      },
    },
  }

  // Breadcrumb schema for navigation
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
        name: 'Shorts',
        item: `${baseUrl}/shorts`,
      },
      ...(genreName ? [{
        '@type': 'ListItem',
        position: 3,
        name: genreName,
        item: `${baseUrl}/shorts?genre=${novel.shortNovelGenre}`,
      }] : []),
      {
        '@type': 'ListItem',
        position: genreName ? 4 : 3,
        name: novel.title.length > 50 ? novel.title.substring(0, 50) + '...' : novel.title,
        item: novelUrl,
      },
    ],
  }

  // WebPage schema
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${novelUrl}#webpage`,
    url: novelUrl,
    name: `${novel.title} | Short Novel - ButterNovel`,
    description: novel.blurb.substring(0, 160),
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
    },
    about: {
      '@id': `${novelUrl}#book`,
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['article', '.prose'],
    },
    inLanguage: 'en-US',
    timeRequired: `PT${readingTime}M`,
  }

  // FAQ schema for common questions about the short novel
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How long does it take to read "${novel.title.length > 40 ? novel.title.substring(0, 40) + '...' : novel.title}"?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `This short novel takes approximately ${readingTime} minutes to read. It contains ${novel.wordCount.toLocaleString()} characters, making it perfect for a quick reading session.`,
        },
      },
      {
        '@type': 'Question',
        name: `Is "${novel.title.length > 40 ? novel.title.substring(0, 40) + '...' : novel.title}" free to read?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, this short novel is completely free to read on ButterNovel. No subscription or payment required.',
        },
      },
      {
        '@type': 'Question',
        name: `What genre is "${novel.title.length > 40 ? novel.title.substring(0, 40) + '...' : novel.title}"?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `This story is a ${genreName || 'Short Novel'} by ${novel.authorName}. Browse more ${genreName || 'short novels'} on ButterNovel.`,
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  )
}
