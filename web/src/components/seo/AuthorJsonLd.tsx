// src/components/seo/AuthorJsonLd.tsx
// SEO: Person structured data for author pages
// Helps Google understand author identity and their works

interface AuthorJsonLdProps {
  name: string
  description?: string
  image?: string
  url: string
  novels?: Array<{
    title: string
    url: string
    coverImage?: string
  }>
  followerCount?: number
}

export default function AuthorJsonLd({
  name,
  description,
  image,
  url,
  novels = [],
  followerCount,
}: AuthorJsonLdProps) {
  const baseUrl = 'https://butternovel.com'

  const authorSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': url.startsWith('http') ? url : `${baseUrl}${url}`,
    name,
    ...(description && { description }),
    ...(image && { image }),
    url: url.startsWith('http') ? url : `${baseUrl}${url}`,
    ...(followerCount && {
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/FollowAction',
        userInteractionCount: followerCount,
      },
    }),
    ...(novels.length > 0 && {
      author: novels.map((novel) => ({
        '@type': 'Book',
        name: novel.title,
        url: novel.url.startsWith('http') ? novel.url : `${baseUrl}${novel.url}`,
        ...(novel.coverImage && { image: novel.coverImage }),
      })),
    }),
    sameAs: [], // Can add social media links if available
    worksFor: {
      '@type': 'Organization',
      name: 'ButterNovel',
      url: baseUrl,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(authorSchema) }}
    />
  )
}
