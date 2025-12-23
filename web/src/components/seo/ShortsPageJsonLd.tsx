// src/components/seo/ShortsPageJsonLd.tsx
// Structured data for /shorts browse page
// Includes: CollectionPage, ItemList, FAQPage, BreadcrumbList schemas

export default function ShortsPageJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'
  const shortsUrl = `${baseUrl}/shorts`

  // CollectionPage schema - main schema for the shorts browse page
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${shortsUrl}#collection`,
    name: 'Short Novels - Quick Reads in 10-30 Minutes | ButterNovel',
    description: 'Browse our collection of free short novels. Complete stories you can finish in 10-30 minutes. Fantasy, romance, thriller, horror, and more genres.',
    url: shortsUrl,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
    },
    about: {
      '@type': 'Thing',
      name: 'Short Novels',
      description: 'Complete short stories ranging from 15,000 to 50,000 characters, perfect for quick reading sessions.',
    },
    inLanguage: 'en-US',
  }

  // ItemList schema - list of short novel genres
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Short Novel Genres',
    description: 'Browse short novels by genre',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Fantasy Short Novels', url: `${shortsUrl}?genre=fantasy` },
      { '@type': 'ListItem', position: 2, name: 'Romance Short Novels', url: `${shortsUrl}?genre=romance` },
      { '@type': 'ListItem', position: 3, name: 'Thriller Short Novels', url: `${shortsUrl}?genre=thriller` },
      { '@type': 'ListItem', position: 4, name: 'Horror Short Novels', url: `${shortsUrl}?genre=horror` },
      { '@type': 'ListItem', position: 5, name: 'Sci-Fi Short Novels', url: `${shortsUrl}?genre=sci-fi` },
      { '@type': 'ListItem', position: 6, name: 'Mystery Short Novels', url: `${shortsUrl}?genre=mystery` },
      { '@type': 'ListItem', position: 7, name: 'Drama Short Novels', url: `${shortsUrl}?genre=drama` },
      { '@type': 'ListItem', position: 8, name: 'Comedy Short Novels', url: `${shortsUrl}?genre=comedy` },
      { '@type': 'ListItem', position: 9, name: 'Historical Short Novels', url: `${shortsUrl}?genre=historical` },
      { '@type': 'ListItem', position: 10, name: 'Urban Short Novels', url: `${shortsUrl}?genre=urban` },
      { '@type': 'ListItem', position: 11, name: 'Wuxia Short Novels', url: `${shortsUrl}?genre=wuxia` },
      { '@type': 'ListItem', position: 12, name: 'Xuanhuan Short Novels', url: `${shortsUrl}?genre=xuanhuan` },
      { '@type': 'ListItem', position: 13, name: 'Slice of Life Short Novels', url: `${shortsUrl}?genre=slice-of-life` },
      { '@type': 'ListItem', position: 14, name: 'Adventure Short Novels', url: `${shortsUrl}?genre=adventure` },
      { '@type': 'ListItem', position: 15, name: 'Paranormal Short Novels', url: `${shortsUrl}?genre=paranormal` },
      { '@type': 'ListItem', position: 16, name: 'Inspirational Short Novels', url: `${shortsUrl}?genre=inspirational` },
    ],
  }

  // BreadcrumbList schema
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
        name: 'Short Novels',
        item: shortsUrl,
      },
    ],
  }

  // WebPage schema
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${shortsUrl}#webpage`,
    url: shortsUrl,
    name: 'Short Novels - Quick Reads | Free Short Stories Online',
    description: 'Discover free short novels you can finish in one sitting. Browse by genre: fantasy, romance, thriller, horror, mystery, and more. Perfect for busy readers.',
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
    },
    about: {
      '@id': `${shortsUrl}#collection`,
    },
    inLanguage: 'en-US',
  }

  // FAQPage schema for the shorts browse page
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What are short novels on ButterNovel?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Short novels on ButterNovel are complete stories ranging from 15,000 to 50,000 characters. They are designed to be read in one sitting, typically taking 10-30 minutes to complete. Unlike ongoing web novels, short novels have a full beginning, middle, and end.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are short novels free to read?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all short novels on ButterNovel are 100% free to read. No subscription, no coins, no hidden fees. Just click and start reading immediately.',
        },
      },
      {
        '@type': 'Question',
        name: 'What genres of short novels are available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ButterNovel offers short novels in 16 genres: Fantasy, Romance, Thriller, Horror, Sci-Fi, Mystery, Drama, Comedy, Historical, Urban, Wuxia, Xuanhuan, Slice of Life, Adventure, Paranormal, and Inspirational. Filter by genre to find your perfect quick read.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does it take to read a short novel?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most short novels on ButterNovel take 10-30 minutes to read, depending on the story length and your reading speed. Each story shows an estimated reading time before you start.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I read short novels on my phone?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! ButterNovel is fully mobile-friendly. Read short novels on any device - phone, tablet, or computer. The reader automatically adjusts to your screen size for the best reading experience.',
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
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
