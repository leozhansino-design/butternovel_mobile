// src/components/seo/CollectionJsonLd.tsx
// SEO: CollectionPage structured data for category/tag/search result pages
// Helps Google understand collections of books

interface CollectionBook {
  title: string
  url: string
  coverImage?: string
  author?: string
  rating?: number
}

interface CollectionJsonLdProps {
  name: string
  description: string
  url: string
  books: CollectionBook[]
  totalItems?: number
}

export default function CollectionJsonLd({
  name,
  description,
  url,
  books,
  totalItems,
}: CollectionJsonLdProps) {
  const baseUrl = 'https://butternovel.com'

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': url.startsWith('http') ? url : `${baseUrl}${url}`,
    name,
    description,
    url: url.startsWith('http') ? url : `${baseUrl}${url}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'ButterNovel',
      alternateName: ['Butter Novel', 'butternovel.com'],
      url: baseUrl,
    },
    mainEntity: {
      '@type': 'ItemList',
      name: `${name} - Book Collection`,
      description,
      numberOfItems: totalItems || books.length,
      itemListElement: books.slice(0, 20).map((book, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Book',
          name: book.title,
          url: book.url.startsWith('http') ? book.url : `${baseUrl}${book.url}`,
          ...(book.coverImage && { image: book.coverImage }),
          ...(book.author && {
            author: {
              '@type': 'Person',
              name: book.author,
            },
          }),
          ...(book.rating && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: book.rating,
              bestRating: 10,
              worstRating: 1,
            },
          }),
          isAccessibleForFree: true,
        },
      })),
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
    />
  )
}
